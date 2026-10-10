// src/services/organization/database/organization.mutations.ts
// src/services/org/database/org.mutations.ts
// Écritures Prisma du service org — Prisma pur, AUCUNE auth ici.
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import { tryConstraint } from '@/utils/server/prisma'
import { updateUserMetadata } from '@/modules/user/update'
import type { OrgDetails } from '../types'
import type { UpdateOrgIdentityInput } from '../validation'
import type { UserStatus } from '@/generated/prisma/browser'
import { PersonalRole } from '@/modules/auth/constants'
import { createRoleSpecificEntity } from '@/modules/auth/members/utils'
import { findPersonalProfileId } from './organization.queries'

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
  role: PersonalRole // TEACHER | STUDENT | PARENT, choisi par l'appelant
  displayName?: string | null // alimente uniquement le slug et le nom technique
  isFirstOrg: boolean // true → l'espace perso devient l'org principale (isMainOrg)
}

export type CreatePersonalOrgData = {
  org: { id: string; name: string; slug: string }
  profileId: string // id du profil du rôle demandé (Teacher, Student ou Parent)
  role: PersonalRole
  created: boolean // true si l'org OU le profil a été écrit dans cet appel
}



// → REMPLACE personal-org-shell.database.ts dans src/services/org/database/org.mutations.ts
//
// Bootstrap ATOMIQUE : Organization + Settings + Usage + UserOrganization +
// premier profil, en une seule transaction. Appelée UNE FOIS — la toute
// première fois qu'un user crée son espace perso. Aucun état intermédiaire :
// soit tout existe, soit rien n'existe (pas d'org sans propriétaire possible).

export async function createPersonalOrgWithProfile(params: {
  userId: string
  role: PersonalRole
  displayName?: string | null
  isFirstOrg: boolean
}) {
  const { slug, name } = buildOrgSlug('PERSONAL', params.displayName)

  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, slug, type: 'PERSONAL' },
        select: { id: true, name: true, slug: true },
      })
      await tx.organizationSettings.create({ data: { orgId: org.id, maxClasses: PERSONAL_MAX_CLASSES } })
      await tx.organizationUsage.create({ data: { orgId: org.id } })

      await tx.userOrganization.create({
        data: {
          userId: params.userId,
          orgId: org.id,
          role: params.role,
          isMainOrg: params.isFirstOrg,
          isResponsable: true,
          status: 'ACTIVE',
        },
      })

      const entity = await createRoleSpecificEntity(tx, params.userId, params.role, org.id)
      if (!entity) throw new Error(`Création du profil ${params.role} impossible`)

      await tx.user.updateMany({ where: { id: params.userId, status: 'PENDING' }, data: { status: 'ACTIVE' } })

      return { org, profileId: entity.id }
    })
  )

  await invalidateEvent('ORG_CREATED', result.org.id)
  return result
}

// → À AJOUTER dans src/services/org/database/org.mutations.ts

//
// N'est plus jamais appelée pour le TOUT PREMIER profil (c'est désormais le
// rôle de createPersonalOrgWithProfile, atomique). Sert uniquement le cas
// "ajouter un second/troisième rôle à un espace perso qui existe déjà" —
// l'invariant "une org perso a toujours un propriétaire" tient depuis sa
// création, donc UserOrganization existe à coup sûr ici : update, pas upsert.


export async function createPersonalProfile(params: {
  userId: string
  orgId: string
  role: PersonalRole
}) {
  return tryConstraint(
    prisma.$transaction(async (tx) => {
      // Relue dans la transaction (pas seulement par l'appelant) pour rester
      // correct sous concurrence — deux clics rapides sur le même rôle.
      const existing = await findPersonalProfileId(params.userId, params.orgId, params.role)

      // Switch : le rôle ACTIF change même si le profil existait déjà.
      await tx.userOrganization.update({
        where: { userId_orgId: { userId: params.userId, orgId: params.orgId } },
        data: { role: params.role, status: 'ACTIVE' },
      })

      if (existing) return existing

      const entity = await createRoleSpecificEntity(tx, params.userId, params.role, params.orgId)
      if (!entity) throw new Error(`Création du profil ${params.role} impossible`)
      return entity.id
    })
  )
}