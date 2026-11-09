import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type { Prisma, Resource } from '@/generated/prisma/client'
import type { Role } from '@/types/user'
import type { CreateNotificationOutput } from '../validation'
import { ROLE_LABELS } from '@/modules/user/constants'

type Tx = Prisma.TransactionClient

// ─── Notifications utilisateur ────────────────────────────────────────────────

export async function createUserNotification(params: {
  userId: string
  data: CreateNotificationOutput
}) {
  const result = await prisma.notification.create({
    data: {
      userId: params.userId,
      message: params.data.message,
      type: params.data.type ?? 'GENERAL',
      scheduleId: params.data.scheduleId ?? null,
      metadata: params.data.metadata
        ? JSON.parse(JSON.stringify(params.data.metadata))
        : null,
    },
    select: {
      id: true,
      message: true,
      type: true,
      read: true,
      scheduleId: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  await invalidateEvent('NOTIFICATION_CREATED', params.userId)
  return result
}

export async function markNotificationRead(params: {
  notificationId: string
  userId: string
}) {
  const result = await prisma.notification.updateMany({
    where: { id: params.notificationId, userId: params.userId },
    data: { read: true },
  })
  await invalidateEvent('NOTIFICATION_READ', params.userId)
  return result
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
  await invalidateEvent('NOTIFICATION_ALL_READ', userId)
  return result
}

// Hard delete — pas de soft delete sur Notification (cycle de vie géré par `read`)
export async function removeNotification(params: {
  notificationId: string
  userId: string
}) {
  await prisma.notification.deleteMany({
    where: { id: params.notificationId, userId: params.userId },
  })
  await invalidateEvent('NOTIFICATION_REMOVED', params.userId)
}

// ─── Notifications admin (scope organisation) ─────────────────────────────────

export async function checkOrgMembership(
  userId: string,
  orgId: string,
): Promise<boolean> {
  const membership = await prisma.userOrganization.findFirst({
    where: { userId, orgId },
    select: { id: true },
  })
  return !!membership
}

export async function createNotificationForOrgUser(params: {
  orgId: string
  userId: string
  data: CreateNotificationOutput
}) {
  const membership = await prisma.userOrganization.findFirst({
    where: { userId: params.userId, orgId: params.orgId },
    select: { id: true },
  })
  if (!membership)
    throw new Error("L'utilisateur n'appartient pas à cette organisation")

  const result = await prisma.notification.create({
    data: {
      userId: params.userId,
      message: params.data.message,
      type: params.data.type ?? 'GENERAL',
      scheduleId: params.data.scheduleId ?? null,
      metadata: params.data.metadata
        ? JSON.parse(JSON.stringify(params.data.metadata))
        : null,
    },
    select: {
      id: true,
      message: true,
      type: true,
      read: true,
      scheduleId: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  await invalidateEvent('NOTIFICATION_CREATED', params.userId)
  return result
}

// ─── Notifications d'invitation (transactions cross-module) ────────────────────

export interface InvitationNotificationSource {
  invitationId: string
  expiresAt: Date
  role: Role
  organization: { id: string; name?: string; slug?: string }
  senderName?: string
  resourceId?: string | null
  resourceType?: Resource | null
}

export function buildInvitationNotification(
  source: InvitationNotificationSource,
) {
  const orgName = source.organization.name ?? 'une organisation'

  return {
    type: 'INVITATION' as const,
    message: `Vous avez été invité à rejoindre ${orgName} en tant que ${ROLE_LABELS[source.role]}.`,
    metadata: {
      kind: 'INVITATION_RECEIVED' as const,
      invitationId: source.invitationId,
      orgId: source.organization.id,
      orgName,
      orgSlug: source.organization.slug ?? null,
      role: source.role,
      resourceType: source.resourceType ?? null,
      resourceId: source.resourceId ?? null,
      senderName: source.senderName ?? 'Un administrateur',
      expiresAt: source.expiresAt.toISOString(),
      status: 'PENDING',
    } satisfies Prisma.InputJsonObject,
  }
}

// N'invalide PAS le cache : c'est à l'appelant, après commit (cf. décision 6).
export async function createInvitationNotification(
  tx: Tx,
  params: { userId: string; source: InvitationNotificationSource },
) {
  const { type, message, metadata } = buildInvitationNotification(params.source)

  return tx.notification.create({
    data: { userId: params.userId, type, message, metadata },
    select: {
      id: true,
      type: true,
      message: true,
      metadata: true,
      createdAt: true,
    },
  })
}

export async function upsertInvitationNotification(
  tx: Tx,
  params: { userId: string; source: InvitationNotificationSource },
) {
  const notification = buildInvitationNotification(params.source)
  const existing = await tx.notification.findFirst({
    where: {
      userId: params.userId,
      type: 'INVITATION',
      metadata: {
        path: ['invitationId'],
        equals: params.source.invitationId,
      },
    },
    select: { id: true },
  })

  if (!existing) {
    return createInvitationNotification(tx, params)
  }

  return tx.notification.update({
    where: { id: existing.id },
    data: {
      read: false,
      message: notification.message,
      metadata: notification.metadata,
    },
    select: {
      id: true,
      type: true,
      message: true,
      metadata: true,
      createdAt: true,
    },
  })
}

export async function setInvitationNotificationStatus(
  tx: Tx,
  params: {
    userId: string
    invitationId: string
    status: 'ACCEPTED' | 'DECLINED' | 'REVOKED'
  },
) {
  const notif = await tx.notification.findFirst({
    where: {
      userId: params.userId,
      type: 'INVITATION',
      metadata: { path: ['invitationId'], equals: params.invitationId },
    },
    select: { id: true, metadata: true },
  })
  if (!notif) return null

  return tx.notification.update({
    where: { id: notif.id },
    data: {
      read: true,
      metadata: { ...(notif.metadata as object), status: params.status },
    },
    select: { id: true },
  })
}

export interface InvitationResponseSource {
  kind: 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED'
  invitationId: string
  orgId: string
  orgName: string
  sender: { id: string; name?: string; email?: string }
}

export async function createInvitationResponseNotification(
  tx: Tx,
  params: { userId: string; source: InvitationResponseSource },
) {
  const isAccepted = params.source.kind === 'INVITATION_ACCEPTED'
  const actorName =
    params.source.sender.name || params.source.sender.email || 'Un utilisateur'
  const message = isAccepted
    ? `${actorName} a accepté votre invitation à rejoindre ${params.source.orgName}.`
    : `${actorName} a décliné votre invitation à rejoindre ${params.source.orgName}.`

  return tx.notification.create({
    data: {
      userId: params.userId,
      type: 'INVITATION',
      message,
      metadata: {
        kind: params.source.kind,
        invitationId: params.source.invitationId,
        orgId: params.source.orgId,
        sendBy: {
          id: params.source.sender.id,
          name: params.source.sender.name ?? null,
          email: params.source.sender.email ?? null,
        },
      } satisfies Prisma.InputJsonObject,
    },
    select: { id: true },
  })
}
