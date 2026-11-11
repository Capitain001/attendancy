import { Resource } from '@/generated/prisma/browser'
import type { Prisma } from '@/generated/prisma/client'
import type { Role } from '@/types/user'
import { ROLE_LABELS } from '@/modules/user/constants'

export const INVITATION_ACTIONS = ['JOIN_ORG', 'JOIN_CLASS', 'GRANT_ROLE'] as const
export type InvitationAction = (typeof INVITATION_ACTIONS)[number]

export function resolveInvitationAction(params: {
  resourceType?: Resource | null
  isExistingMember: boolean
}): InvitationAction {
  if (params.resourceType === Resource.CLASS) return 'JOIN_CLASS'
  return params.isExistingMember ? 'GRANT_ROLE' : 'JOIN_ORG'
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

export const INVITATION_ACCEPT_LABELS: Record<InvitationAction, string> = {
  JOIN_ORG: 'Accepter',
  JOIN_CLASS: 'Rejoindre la classe',
  GRANT_ROLE: 'Accepter le rôle',
}

export function readInvitationContext(metadata: unknown): {
  action: InvitationAction | null
  resourceName: string | null
} {
  const m = (metadata ?? {}) as { action?: InvitationAction; resourceName?: string | null }
  return { action: m.action ?? null, resourceName: m.resourceName ?? null }
}

// ─── Invitation reçue ─────────────────────────────────────────────────────────

export interface InvitationNotificationSource {
  invitationId: string
  expiresAt: Date
  role: Role
  organization: { id: string; name?: string; slug?: string }
  senderName?: string
  resourceId?: string | null
  resourceType?: Resource | null
  resourceName?: string | null
  isExistingMember?: boolean
}

export function buildInvitationNotificationPayload(source: InvitationNotificationSource) {
  const orgName = source.organization.name ?? 'une organisation'
  const isExistingMember = source.isExistingMember ?? false
  const resourceName = source.resourceName ?? null
  const action = resolveInvitationAction({ resourceType: source.resourceType, isExistingMember })

  return {
    type: 'INVITATION' as const,
    message: INVITATION_MESSAGES[action]({
      orgName,
      role: source.role,
      resourceName,
      isExistingMember,
    }),
    metadata: {
      kind: 'INVITATION_RECEIVED' as const,
      action,
      invitationId: source.invitationId,
      orgId: source.organization.id,
      orgName,
      orgSlug: source.organization.slug ?? null,
      role: source.role,
      resourceType: source.resourceType ?? null,
      resourceId: source.resourceId ?? null,
      resourceName,
      senderName: source.senderName ?? 'Un administrateur',
      expiresAt: source.expiresAt.toISOString(),
      status: 'PENDING',
    } satisfies Prisma.InputJsonObject,
  }
}

// ─── Réponse à l'émetteur ─────────────────────────────────────────────────────

export interface InvitationResponseSource {
  kind: 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED'
  invitationId: string
  orgId: string
  orgName: string
  sender: { id: string; name?: string; email?: string }
  action?: InvitationAction | null
  resourceName?: string | null
}

export function buildInvitationResponsePayload(source: InvitationResponseSource) {
  const actorName = source.sender.name || source.sender.email || 'Un utilisateur'
  const target =
    source.action === 'JOIN_CLASS' ? classLabel(source.resourceName ?? null) : source.orgName
  const verb = source.kind === 'INVITATION_ACCEPTED' ? 'accepté' : 'décliné'

  return {
    type: 'INVITATION' as const,
    message: `${actorName} a ${verb} votre invitation à rejoindre ${target}.`,
    metadata: {
      kind: source.kind,
      action: source.action ?? null,
      invitationId: source.invitationId,
      orgId: source.orgId,
      resourceName: source.resourceName ?? null,
      sendBy: {
        id: source.sender.id,
        name: source.sender.name ?? null,
        email: source.sender.email ?? null,
      },
    } satisfies Prisma.InputJsonObject,
  }
}

