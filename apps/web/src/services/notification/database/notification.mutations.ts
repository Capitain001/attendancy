// src/services/notification/database/notification.mutations.ts
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type { NotificationType } from '@/generated/prisma/browser'
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

export type NotificationPayload = {
  type: NotificationType
  message: string
  metadata: Prisma.InputJsonObject
}

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  message: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect

// N'invalide PAS le cache : c'est à l'appelant, après commit (cf. décision 6).
export async function createInvitationNotification(
  tx: Tx,
  params: { userId: string; payload: NotificationPayload },
) {
  return tx.notification.create({
    data: { userId: params.userId, ...params.payload },
    select: NOTIFICATION_SELECT,
  })
}

export async function upsertInvitationNotification(
  tx: Tx,
  params: { userId: string; invitationId: string; payload: NotificationPayload },
) {
  const existing = await tx.notification.findFirst({
    where: {
      userId: params.userId,
      type: 'INVITATION',
      metadata: { path: ['invitationId'], equals: params.invitationId },
    },
    select: { id: true },
  })

  if (!existing) return createInvitationNotification(tx, params)

  return tx.notification.update({
    where: { id: existing.id },
    data: {
      read: false,
      message: params.payload.message,
      metadata: params.payload.metadata,
    },
    select: NOTIFICATION_SELECT,
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
    select: { id: true, metadata: true },
  })
}
