import { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { Role } from '@/types/user'
import { ROLE_LABELS } from '@/modules/user/constants'
import type { InvitationAction } from '@/modules/invitation/constants'

import type { SendBy, NotificationPayload, NotificationTarget } from '../types'
import { resolveInvitationAction } from '@/modules/invitation/utils'

export interface InvitationNotificationSource {
  invitationId: string
  expiresAt: Date
  role: Role
  organization: { id: string; name?: string; slug?: string }
  sender?: SendBy
  resourceId?: string | null
  resourceType?: Resource | null
  resourceName?: string | null
  isExistingMember?: boolean
}

export interface InvitationResponseSource {
  event: Extract<NotificationEvent, 'CONFIRMED' | 'REJECTED'>
  invitationId: string
  orgId: string
  orgName: string
  sender: SendBy
  action?: InvitationAction | null
  resourceId?: string | null
  resourceName?: string | null
}

const classLabel = (name: string | null) => (name ? `la classe ${name}` : 'une classe')

export type InvitationMessageInput = {
  orgName: string
  role: Role
  resourceName: string | null
  isExistingMember: boolean
}

export const INVITATION_MESSAGES: Record<InvitationAction, (i: InvitationMessageInput) => string> = {
  JOIN_ORG: (i) =>
    `Vous avez été invité à rejoindre ${i.orgName} en tant que ${ROLE_LABELS[i.role]}.`,
  JOIN_CLASS: (i) =>
    i.isExistingMember
      ? `Vous avez été invité à rejoindre ${classLabel(i.resourceName)}.`
      : `Vous avez été invité à rejoindre ${classLabel(i.resourceName)} de ${i.orgName}.`,
  GRANT_ROLE: (i) => `${i.orgName} vous propose le rôle de ${ROLE_LABELS[i.role]}.`,
}

// ─── Invitation reçue ─────────────────────────────────────────────────────────



const buildTarget = (
  type: Resource | null | undefined,
  id: string | null | undefined,
  name: string | null | undefined,
): NotificationTarget | undefined =>
  type && id ? { type, id, name: name ?? undefined } : undefined

export function buildInvitationNotificationPayload(
  source: InvitationNotificationSource,
): NotificationPayload {
  const orgName = source.organization.name ?? 'une organisation'
  const isExistingMember = source.isExistingMember ?? false
  const resourceName = source.resourceName ?? null
  const action = resolveInvitationAction({ resourceType: source.resourceType, isExistingMember })

  return {
    orgId: source.organization.id,
    resourceType: 'INVITATION',
    resourceId: source.invitationId,
    event: 'CREATED',
    message: INVITATION_MESSAGES[action]({ orgName, role: source.role, resourceName, isExistingMember }),
    metadata: {
      action,
      role: source.role,
      target: buildTarget(source.resourceType, source.resourceId, resourceName),
      sendBy: source.sender,
      // LEGACY : lus par la carte d'invitation, à supprimer quand l'UI lira l'invitation via resourceId
      expiresAt: source.expiresAt.toISOString(),
      status: 'PENDING',
    },
  }
}

export function buildInvitationResponsePayload(
  source: InvitationResponseSource,
) {
  const actorName = source.sender.name || source.sender.email || 'Un utilisateur'
  const isClass = source.action === 'JOIN_CLASS'
  const subject = isClass ? classLabel(source.resourceName ?? null) : source.orgName
  const verb = source.event === 'CONFIRMED' ? 'accepté' : 'décliné'

  return {
    orgId: source.orgId,
    resourceType: Resource.INVITATION,
    resourceId: source.invitationId,
    event: source.event,
    message: `${actorName} a ${verb} votre invitation à rejoindre ${subject}.`,
    metadata: {
      action: source.action ?? 'JOIN_ORG',
      target: isClass ? buildTarget('CLASS', source.resourceId, source.resourceName) : undefined,
      sendBy: source.sender,
    },
  }
}