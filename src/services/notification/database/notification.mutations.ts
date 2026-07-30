import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateNotificationOutput } from '../validation'

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
      metadata: params.data.metadata ? JSON.parse(JSON.stringify(params.data.metadata)) : null,
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

export async function markNotificationRead(params: { notificationId: string; userId: string }) {
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

export async function removeNotification(params: { notificationId: string; userId: string }) {
  await prisma.notification.deleteMany({
    where: { id: params.notificationId, userId: params.userId },
  })
  await invalidateEvent('NOTIFICATION_REMOVED', params.userId)
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
  if (!membership) throw new Error("L'utilisateur n'appartient pas à cette organisation")

  const result = await prisma.notification.create({
    data: {
      userId: params.userId,
      message: params.data.message,
      type: params.data.type ?? 'GENERAL',
      scheduleId: params.data.scheduleId ?? null,
      metadata: params.data.metadata ? JSON.parse(JSON.stringify(params.data.metadata)) : null,
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
