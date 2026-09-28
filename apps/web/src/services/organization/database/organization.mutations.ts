// src/services/org/database/org.mutations.ts
// Écritures Prisma du service org — Prisma pur, AUCUNE auth ici.
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import { tryConstraint } from '@/utils/server/prisma'
import { updateUserMetadata } from '@/modules/user/update'
import type { OrgDetails } from '../types'
import type { UpdateOrgIdentityInput } from '../validation'
import type { UserStatus } from '@/generated/prisma/browser'

export type CreateOrgParams = {
  userId: string
  name: string
  slug: string
  email?: string
}

export type CreateOrgData = {
  org: { id: string; name: string; slug: string }
  directionId: string
}

// Transaction complète de création : Organization + Settings + Usage + UserOrganization (DIRECTION)
// + Direction record + User.status ACTIVE + Subscription TRIALING sur plan STARTER.
export async function createOrgWithDefaults(params: CreateOrgParams) {
  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: params.name, slug: params.slug, email: params.email },
        select: { id: true, name: true, slug: true },
      })

      await tx.organizationSettings.create({ data: { orgId: org.id } })
      await tx.organizationUsage.create({ data: { orgId: org.id } })

      await tx.userOrganization.create({
        data: {
          userId: params.userId,
          orgId: org.id,
          role: 'DIRECTION',
          isMainOrg: true,
          isResponsable: true,
          status: 'ACTIVE',
        },
      })

      const direction = await tx.direction.create({
        data: { userId: params.userId, orgId: org.id },
        select: { id: true },
      })

      await tx.user.update({
        where: { id: params.userId },
        data: { status: 'ACTIVE' },
      })

      // PROD-004 : TRIALING illimitée dès la création — plan STARTER si disponible.
      const starterPlan = await tx.plan.findFirst({ where: { code: 'STARTER', isActive: true } })
      if (starterPlan) {
        await tx.subscription.create({
          data: { orgId: org.id, planId: starterPlan.id, status: 'TRIALING' },
        })
      }

      return {
        org: { id: org.id, name: org.name, slug: org.slug ?? params.slug },
        directionId: direction.id,
      }
    })
  )

  await invalidateEvent('ORG_CREATED', result.org.id)
  return result
}

export async function updateOrganization(orgId: string, data: UpdateOrgIdentityInput) {
  const result = await tryConstraint(
    prisma.organization.update({
      where: { id: orgId },
      data,
      select: { id: true, slug: true, name: true },
    })
  )
  await invalidateEvent('ORG_UPDATED', orgId)
  return result
}

export async function setOrgDetails(orgId: string, details: OrgDetails) {
  const org = await tryConstraint(
    prisma.organization.update({
      where: { id: orgId },
      data: { details: JSON.parse(JSON.stringify(details)) },
      select: { details: true },
    })
  )
  await invalidateEvent('ORG_UPDATED', orgId)
  return org.details as OrgDetails | null
}

export async function updateOrgLogo(orgId: string, logo: string) {
  const result = await tryConstraint(
    prisma.organization.update({
      where: { id: orgId },
      data: { logo },
      select: { id: true, logo: true },
    })
  )
  await invalidateEvent('ORG_UPDATED', orgId)
  return result
}

// Bascule le statut d'un membre (STUDENT/TEACHER) dans l'org — atomique + audit.
// Ne touche QUE UserOrganization.status, jamais User.deletedAt ni Attendance.
export async function setMemberStatusWithAudit(params: {
  orgId: string
  userId: string
  role: 'STUDENT' | 'TEACHER'
  status: Extract<UserStatus, 'ACTIVE' | 'INACTIVE'>
  actorUserId: string
  profileId?: string
}) {
  const { orgId, userId, role, status, actorUserId } = params

  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const res = await tx.userOrganization.updateMany({
        where: { userId, orgId, role },
        data: { status },
      })
      if (res.count === 0) throw new Error('Membre introuvable dans cette organisation')

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: status === 'INACTIVE' ? 'DELETE' : 'UPDATE',
          resource: role,
          resourceId: userId,
          orgId,
          details: {
            event: status === 'INACTIVE' ? 'MEMBER_DEACTIVATED' : 'MEMBER_REACTIVATED',
            targetUserId: userId,
            role,
            status,
            orgId,
          },
        },
      })

      return { userId, status }
    })
  )

  // Best-effort : met à jour les métadonnées Supabase pour que l'auth soit cohérente.
  try {
    await updateUserMetadata(userId, { status })
  } catch (err) {
    console.warn('[setMemberStatusWithAudit] projection Supabase échouée:', err)
  }

  await invalidateEvent('ORG_UPDATED', orgId)
  return result
}




/* PERSONAL MUTATION */
// → À AJOUTER dans src/services/org/database/org.mutations.ts
// (Organization en est le modèle propriétaire ; même précédent transactionnel
// multi-modèles que createOrgWithDefaults.)
import { buildOrgSlug } from '@/lib/slug'

// Quota gratuit d'un espace personnel (FEATURE-teacher-personal-org §3.3).
// Initialisé explicitement : le défaut générique (10) est pensé pour les institutions.
// → à déplacer dans org/constants.ts si tu préfères.
const PERSONAL_MAX_CLASSES = 5

export type CreatePersonalOrgParams = {
  userId: string
  displayName?: string | null // alimente uniquement le slug et le nom technique
  isFirstOrg: boolean // true → l'espace perso devient l'org principale (isMainOrg)
}

export type CreatePersonalOrgData = {
  org: { id: string; name: string; slug: string }
  teacherId: string
  created: boolean
}

// Idempotent : si l'user a déjà un espace personnel actif, on le renvoie
// (created: false). L'action re-projette alors les metadata Supabase, ce qui
// répare l'échec partiel « DB écrite, metadata non ».
//
// Ce que l'espace perso NE reçoit PAS, volontairement :
//   - pas de Direction ni de UserOrganization DIRECTION (FEATURE §3.1)
//   - pas de Subscription : gratuit par construction (FEATURE §3.3 / §8)
//   - pas de structure académique : créée à la demande par le service academic
//     à la première classe, pas ici (elle lui appartient).
export async function createPersonalOrgWithDefaults(params: CreatePersonalOrgParams) {
  const { userId } = params

  const result = await tryConstraint(
    prisma.$transaction(async (tx): Promise<CreatePersonalOrgData> => {
      const existing = await tx.userOrganization.findFirst({
        where: { userId, organization: { type: 'PERSONAL', deletedAt: null } },
        select: { organization: { select: { id: true, name: true, slug: true } } },
      })

      if (existing) {
        const { organization: org } = existing
        if (!org.slug) throw new Error('Espace personnel invalide : slug manquant')

        const teacher = await tx.teacher.findUnique({
          where: { userId_orgId: { userId, orgId: org.id } },
          select: { id: true },
        })
        if (!teacher) throw new Error('Profil enseignant introuvable pour cet espace personnel')

        return { org: { id: org.id, name: org.name, slug: org.slug }, teacherId: teacher.id, created: false }
      }

      const { slug, name } = buildOrgSlug('PERSONAL', params.displayName)

      const org = await tx.organization.create({
        data: { name, slug, type: 'PERSONAL' },
        select: { id: true, name: true },
      })

      await tx.organizationSettings.create({
        data: { orgId: org.id, maxClasses: PERSONAL_MAX_CLASSES },
      })
      await tx.organizationUsage.create({ data: { orgId: org.id } })

      await tx.userOrganization.create({
        data: {
          userId,
          orgId: org.id,
          role: 'TEACHER',
          isMainOrg: params.isFirstOrg,
          isResponsable: true,
          status: 'ACTIVE',
        },
      })

      const teacher = await tx.teacher.create({
        data: { userId, orgId: org.id },
        select: { id: true },
      })

      // Compte issu d'un signup solo : PENDING → ACTIVE. updateMany + filtre :
      // n'écrase jamais un SUSPENDED/INACTIVE d'un enseignant déjà rattaché.
      await tx.user.updateMany({
        where: { id: userId, status: 'PENDING' },
        data: { status: 'ACTIVE' },
      })

      return { org: { id: org.id, name: org.name, slug }, teacherId: teacher.id, created: true }
    })
  )

  if (result.created) await invalidateEvent('ORG_CREATED', result.org.id)
  return result
}