//apps\web\src\modules\invitation\utils.ts
import { Resource } from '@/generated/prisma/browser'
import type { Role } from '@/types/user'
import { ROLE_LABELS } from '@/modules/user/constants'
import { InvitationAction } from '@/modules/invitation/constants'

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

