// src/services/org/database/org.mutations.ts
// Écritures Prisma du service org — Prisma pur, AUCUNE auth ici.
import { prisma } from '@/lib/prisma'
import { invalidateCache, invalidateEvent } from '@/cache/server/graph'
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

// Idempotent, en UNE transaction : org + profil du rôle demandé.
// - Espace perso absent        → on crée org + Settings + Usage + UserOrganization + profil.
// - Espace perso présent, profil du rôle absent → on ajoute seulement le profil (et on aligne UserOrganization.role).
// - Tout existe déjà           → created: false (l'action re-projette les metadata Supabase).
//
// Ce que l'espace perso NE reçoit PAS, volontairement :
//   - pas de Direction ni de UserOrganization DIRECTION (FEATURE §3.1)
//   - pas de Subscription : gratuit par construction (FEATURE §3.3 / §8)
//   - pas de structure académique : créée à la demande par le service academic
export async function createPersonalOrgWithDefaults(params: CreatePersonalOrgParams) {
  const { userId, role } = params
  let orgCreated = false

  const result = await tryConstraint(
    prisma.$transaction(async (tx): Promise<CreatePersonalOrgData> => {
      // 1. Org : réutiliser l'espace perso actif ou le créer
      const existing = await tx.userOrganization.findFirst({
        where: { userId, organization: { type: 'PERSONAL', deletedAt: null } },
        select: { organization: { select: { id: true, name: true, slug: true } } },
      })

      let org: { id: string; name: string; slug: string }

      if (existing) {
        const { organization } = existing
        if (!organization.slug) throw new Error('Espace personnel invalide : slug manquant')
        org = { id: organization.id, name: organization.name, slug: organization.slug }
      } else {
        const { slug, name } = buildOrgSlug('PERSONAL', params.displayName)

        const created = await tx.organization.create({
          data: { name, slug, type: 'PERSONAL' },
          select: { id: true, name: true },
        })

        await tx.organizationSettings.create({
          data: { orgId: created.id, maxClasses: PERSONAL_MAX_CLASSES },
        })
        await tx.organizationUsage.create({ data: { orgId: created.id } })

        org = { id: created.id, name: created.name, slug }
        orgCreated = true
      }

      // 2. Profil du rôle demandé : anti-doublon (cf. findPersonalProfileId)
      const existingProfileId = existing
        ? await findPersonalProfileId(userId, org.id, role)
        : null

      if (existingProfileId) {
        // Le rôle actif reflète le dernier profil choisi (même règle que createPersonalProfile)
        await tx.userOrganization.update({
          where: { userId_orgId: { userId, orgId: org.id } },
          data: { role, status: 'ACTIVE' },
        })
        return { org, profileId: existingProfileId, role, created: orgCreated }
      }

      // 3. UserOrganization avec le rôle demandé (plus de 'TEACHER' en dur)
      await tx.userOrganization.upsert({
        where: { userId_orgId: { userId, orgId: org.id } },
        create: {
          userId,
          orgId: org.id,
          role,
          isMainOrg: params.isFirstOrg,
          isResponsable: true,
          status: 'ACTIVE',
        },
        update: { role, status: 'ACTIVE' },
      })

      // 4. Profil spécifique au rôle (Teacher / Student / Parent)
      const entity = await createRoleSpecificEntity(tx, userId, role, org.id)
      if (!entity) throw new Error(`Création du profil ${role} impossible`)

      // Signup solo : PENDING → ACTIVE, sans écraser un SUSPENDED/INACTIVE
      await tx.user.updateMany({ where: { id: userId, status: 'PENDING' }, data: { status: 'ACTIVE' } })

      return { org, profileId: entity.id, role, created: true }
    })
  )

  if (orgCreated) await invalidateEvent('ORG_CREATED', result.org.id)
  return result
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

export async function ensurePersonalAcademicScaffold(orgId: string) {
  const result = await tryConstraint(prisma.$transaction(async (tx) => {
    const organization = await tx.organization.findFirst({
      where: { id: orgId, type: 'PERSONAL', deletedAt: null },
      select: { id: true },
    })
    if (!organization) throw new Error('Espace personnel introuvable')

    const currentYear = await tx.academicYear.findFirst({
      where: { orgId, isActive: true, isCurrent: true },
      select: { id: true },
    })
    const academicYear = currentYear ?? await tx.academicYear.upsert({
      where: { name_orgId: { name: 'Espace personnel', orgId } },
      create: {
        name: 'Espace personnel',
        startDate: new Date('2000-01-01T00:00:00.000Z'),
        endDate: new Date('2100-12-31T00:00:00.000Z'),
        orgId,
        isCurrent: true,
      },
      update: { isActive: true, isCurrent: true },
      select: { id: true },
    })

    const department = await tx.department.upsert({
      where: { name_orgId: { name: 'Espace personnel', orgId } },
      create: { name: 'Espace personnel', orgId },
      update: {},
      select: { id: true },
    })
    const programTrack = await tx.programTrack.upsert({
      where: { name_departmentId: { name: 'Espace personnel', departmentId: department.id } },
      create: { name: 'Espace personnel', departmentId: department.id, orgId },
      update: {},
      select: { id: true },
    })

    return { academicYearId: academicYear.id, programTrackId: programTrack.id }
  }))

  await invalidateEvent('ACADEMIC_YEAR_CREATED', orgId)
  await invalidateEvent('DEPARTMENT_CREATED', orgId)
  await invalidateCache('PROGRAM_TRACK', orgId)
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