'use server'

import * as v from 'valibot'
import { prisma } from '@/lib/prisma'
import { getUserInfo } from '@/modules/user'
import { setUserAccess } from '@/modules/user/access'
import { injectRoleProfileId } from '@/modules/user/profile'
import { invalidateEvent } from '@/cache/server/graph'
import { Action, Resource, Role } from '@/generated/prisma/client'
import { logAuditAsync } from '@/utils/server'
import type { DatabaseInvitationDetails } from '@/types/invitation'
import {
  setInvitationNotificationStatus,
  createInvitationResponseNotification,
} from '@/services/notification/server'
import {
  createRoleSpecificEntity,
  assignFunctionToUser,
  assignMultipleFunctionsToUser,
  enrollStudentInClass,
} from './utils'

const invitationActionSchema = v.object({
  invitationId: v.pipe(v.string(), v.uuid('ID d\'invitation invalide')),
})

// ─── 1. ACCEPTER L'INVITATION ─────────────────────────────────────────────────

export async function acceptInboxInvitationAction(input: { invitationId: string }) {
  const user = await getUserInfo()
  if (!user?.id || !user.email) return { error: 'Non authentifié' }
  const userId = user.id

  const parsed = v.safeParse(invitationActionSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'ID invalide' }
  }
  const { invitationId } = parsed.output

  // 1. Lecture préalable & validation d'identité
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      orgId: true,
      role: true,
      details: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  })

  if (!invitation) {
    return { error: 'Invitation introuvable, déjà traitée ou expirée' }
  }

  const details = (invitation.details as DatabaseInvitationDetails) ?? {}
  const role = (invitation.role ?? details.role) as Role | undefined
  if (!role) {
    return { error: 'Invitation invalide : aucun rôle associé' }
  }

  const orgId = invitation.orgId
  const departmentId = details.organization?.departmentId
  const senderId = details.invited_by?.id

  try {
    const { profileId } = await prisma.$transaction(
      async (tx) => {
        // A. Claim atomique : verrouille immédiatement l'invitation contre les doubles clics
        const claimed = await tx.invitation.updateMany({
          where: { id: invitation.id, userId, usedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        })
        if (claimed.count !== 1) {
          throw new Error('Invitation déjà traitée ou expirée')
        }

        // B. Créer l'adhésion UserOrganization si non existante
        const existingMembership = await tx.userOrganization.findFirst({
          where: { userId, orgId },
          select: { id: true },
        })

        if (!existingMembership) {
          const totalUserOrgs = await tx.userOrganization.count({ where: { userId } })
          await tx.userOrganization.create({
            data: {
              userId,
              orgId,
              role,
              isMainOrg: totalUserOrgs === 0,
              isResponsable: false,
            },
          })
        }

        // C. Créer l'entité métier selon le rôle (Teacher, Student, Parent, etc.)
        const profile = await createRoleSpecificEntity(
          tx,
          userId,
          role,
          orgId,
          departmentId,
        )

        // D. Assigner les fonctions
        await assignFunctionToUser(
          tx,
          userId,
          orgId,
          details.function,
          details.invited_by?.id,
        )

        if (role === 'DIRECTION' && Array.isArray(details.additionalFunctions)) {
          await assignMultipleFunctionsToUser(
            tx,
            userId,
            orgId,
            details.additionalFunctions,
            details.invited_by?.id,
          )
        }

        // E. Liens spécifiques (Parent / Student)
        if (role === 'PARENT' && details.parentLink?.studentId && profile?.id) {
          await tx.parentRelation.create({
            data: {
              parentId: profile.id,
              studentId: details.parentLink.studentId,
              relation: details.parentLink.relation || 'Parent',
              orgId,
            },
          })
        }

        if (role === 'STUDENT' && profile?.id && details.enrollment) {
          await enrollStudentInClass(tx, profile.id, details.enrollment)
        }

        // F. Mettre à jour la notification via le service notification
        await setInvitationNotificationStatus(tx, {
          userId,
          invitationId: invitation.id,
          status: 'ACCEPTED',
        })

        // G. Notifier l'émetteur de l'acceptation via le service notification
        if (senderId) {
          await createInvitationResponseNotification(tx, {
            userId: senderId,
            source: {
              kind: 'INVITATION_ACCEPTED',
              invitationId: invitation.id,
              orgId: invitation.orgId,
              orgName: invitation.organization.name,
              sender: { id: userId, name: user.name, email: user.email },
            },
          })
        }

        return { profileId: profile?.id }
      },
      { maxWait: 10000, timeout: 20000 },
    )

    // 2. Post-commit : mise à jour des accès session sans écraser l'org active
    let sessionWarning: string | undefined
    try {
      const orgData = injectRoleProfileId(
        {
          ...details.organization,
          id: orgId,
          name: invitation.organization.name,
          slug: invitation.organization.slug ?? undefined,
        },
        role,
        profileId,
      )
      const currentUser = await getUserInfo({ refresh: true })
      const hasActiveOrg = !!currentUser?.organization?.id

      const updatedOrgs = [
        ...(currentUser?.organizations ?? []).filter((o) => o.id !== orgId),
        orgData,
      ]

      await setUserAccess({
        status: 'ACTIVE',
        organizations: updatedOrgs,
        ...(hasActiveOrg ? {} : {
          role,
          function: details.function,
          organization: orgData,
        }),
      })
    } catch (sessionErr) {
      console.error('[acceptInboxInvitationAction] Erreur setUserAccess non bloquante:', sessionErr)
      sessionWarning = 'Adhésion validée, reconnectez-vous si vos accès tardent à s’actualiser.'
    }

    // 3. Post-commit : invalidations de cache
    try {
      await invalidateEvent('NOTIFICATION_READ', userId)
      if (senderId) {
        await invalidateEvent('NOTIFICATION_CREATED', senderId)
      }
    } catch (cacheErr) {
      console.error('[acceptInboxInvitationAction] Erreur invalidation cache:', cacheErr)
    }

    // 4. Audit
    logAuditAsync({
      userId,
      action: Action.CREATE,
      resource: Resource.USER,
      resourceId: invitation.id,
      orgId,
      details: {
        action_type: 'ACCEPT_INVITATION',
        role,
        invitationId: invitation.id,
      },
    })

    return {
      data: {
        success: true,
        orgSlug: invitation.organization.slug,
        orgName: invitation.organization.name,
        ...(sessionWarning ? { warning: sessionWarning } : {}),
      },
    }
  } catch (error) {
    console.error('[acceptInboxInvitationAction] erreur:', error)
    return { error: error instanceof Error ? error.message : 'Erreur lors de l’acceptation' }
  }
}

// ─── 2. REFUSER L'INVITATION ─────────────────────────────────────────────────

export async function declineInboxInvitationAction(input: { invitationId: string }) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }
  const userId = user.id

  const parsed = v.safeParse(invitationActionSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'ID invalide' }
  }
  const { invitationId } = parsed.output

  // Lecture préalable indispensable pour récupérer details et senderId
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      orgId: true,
      role: true,
      details: true,
      organization: { select: { id: true, name: true } },
    },
  })

  if (!invitation) {
    return { error: 'Invitation introuvable ou déjà traitée' }
  }

  const existingDetails = (invitation.details as DatabaseInvitationDetails) ?? {}
  const senderId = existingDetails.invited_by?.id

  try {
    await prisma.$transaction(
      async (tx) => {
        // A. Claim atomique & refus : expire l'invitation et met status = 'DECLINED'
        const claimed = await tx.invitation.updateMany({
          where: { id: invitation.id, userId, usedAt: null, expiresAt: { gt: new Date() } },
          data: {
            expiresAt: new Date(),
            details: {
              ...(existingDetails as object),
              status: 'DECLINED',
            },
          },
        })
        if (claimed.count !== 1) {
          throw new Error('Invitation déjà traitée ou expirée')
        }

        // B. Mettre à jour la notification du destinataire
        await setInvitationNotificationStatus(tx, {
          userId,
          invitationId: invitation.id,
          status: 'DECLINED',
        })

        // C. Notifier l'émetteur de l'invitation
        if (senderId) {
          await createInvitationResponseNotification(tx, {
            userId: senderId,
            source: {
              kind: 'INVITATION_DECLINED',
              invitationId: invitation.id,
              orgId: invitation.orgId,
              orgName: invitation.organization?.name ?? 'l’organisation',
              sender: { id: userId, name: user.name, email: user.email },
            },
          })
        }
      },
      { maxWait: 10000, timeout: 20000 },
    )

    // Invalidation après commit
    try {
      await invalidateEvent('NOTIFICATION_READ', userId)
      if (senderId) {
        await invalidateEvent('NOTIFICATION_CREATED', senderId)
      }
    } catch (e) {
      console.error('[declineInboxInvitationAction] invalidation échouée', e)
    }

    return { data: { success: true } }
  } catch (error) {
    console.error('[declineInboxInvitationAction] erreur:', error)
    return { error: error instanceof Error ? error.message : 'Erreur lors du refus' }
  }
}
