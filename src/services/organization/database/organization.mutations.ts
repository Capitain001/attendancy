// src/services/org/database/org.mutations.ts
// Écritures Prisma du service org — Prisma pur, AUCUNE auth ici.
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'
import { tryConstraint } from '@/utils/server/prisma'
import { updateUserMetadata } from '@/modules/user/update'
import type { OrgDetails } from '../types'
import type { UpdateOrgIdentityInput } from '../validation'
import type { UserStatus } from '@/generated/prisma'

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