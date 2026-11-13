// src/services/notification/database/notification.mutations.ts
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type { Prisma } from '@/generated/prisma/client'
import type { NotificationPayload } from '../types'
import type { CreateAdminNotificationOutput } from '../validation'

type Tx = Prisma.TransactionClient

// ─── Notifications utilisateur ────────────────────────────────────────────────

export async function createUserNotification(params: {
  userId: string
  data: NotificationPayload
}) {
  const result = await prisma.notification.create({
    data: {
      userId: params.userId,
      orgId: params.data.orgId ?? null,
      message: params.data.message,
      resourceType: params.data.resourceType ?? null,
      resourceId: params.data.resourceId ?? null,
      event: params.data.event ?? null,
      metadata: params.data.metadata
        ? JSON.parse(JSON.stringify(params.data.metadata))
        : null,
    },
    select: {
      id: true,
      message: true,
      resourceType: true,
      resourceId: true,
      event: true,
      read: true,
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
  data: CreateAdminNotificationOutput
}) {
  const isMember = await checkOrgMembership(params.userId, params.orgId)
  if (!isMember) {
    throw new Error("L'utilisateur n'appartient pas à cette organisation")
  }

  const result = await prisma.notification.create({
    data: {
      userId: params.userId,
      orgId: params.orgId,
      message: params.data.message,
      resourceType: params.data.resourceType ?? null,
      resourceId: params.data.resourceId ?? null,
      event: params.data.event ?? null,
    },
    select: {
      id: true,
      message: true,
      resourceType: true,
      resourceId: true,
      event: true,
      read: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  await invalidateEvent('NOTIFICATION_CREATED', params.userId)
  return result
}

// ─── Notifications d'invitation (transactions cross-module) ────────────────────

const NOTIFICATION_SELECT = {
  id: true,
  resourceType: true,
  resourceId: true,
  event: true,
  message: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect

// N'invalide PAS le cache : c'est à l'appelant, après commit.
export async function createInvitationNotification(
  tx: Tx,
  params: { userId: string; payload: NotificationPayload },
) {
  return tx.notification.create({
    data: {
      userId: params.userId,
      orgId: params.payload.orgId ?? null,
      message: params.payload.message,
      resourceType: params.payload.resourceType ?? 'INVITATION',
      resourceId: params.payload.resourceId ?? null,
      event: params.payload.event ?? 'CREATED',
      metadata: params.payload.metadata
        ? JSON.parse(JSON.stringify(params.payload.metadata))
        : undefined,
    },
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
      resourceType: 'INVITATION',
      resourceId: params.invitationId,
    },
    select: { id: true },
  })

  if (!existing) return createInvitationNotification(tx, params)

  return tx.notification.update({
    where: { id: existing.id },
    data: {
      read: false,
      message: params.payload.message,
      metadata: params.payload.metadata
        ? JSON.parse(JSON.stringify(params.payload.metadata))
        : undefined,
      event: params.payload.event ?? 'CREATED',
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
      resourceType: 'INVITATION',
      resourceId: params.invitationId,
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
