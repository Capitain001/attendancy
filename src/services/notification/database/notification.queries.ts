import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getNotificationsForUser(userId: string, limit = 20) {
  'use cache'
  cacheTag(CACHE.NOTIFICATION(userId))
  cacheLife(CACHE.NOTIFICATION.life)
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
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
}

export async function getUnreadNotificationsForUser(userId: string, limit = 10) {
  'use cache'
  cacheTag(CACHE.NOTIFICATION(userId))
  cacheLife(CACHE.NOTIFICATION.life)
  return prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
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
}

export async function getUnreadCountForUser(userId: string) {
  'use cache'
  cacheTag(CACHE.NOTIFICATION(userId))
  cacheLife(CACHE.NOTIFICATION.life)
  return prisma.notification.count({ where: { userId, read: false } })
}

export async function getOrganizationNotifications(orgId: string, limit = 50) {
  return prisma.notification.findMany({
    where: {
      user: { userOrganizations: { some: { orgId } } },
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getOrganizationUnreadNotifications(orgId: string, limit = 50) {
  return prisma.notification.findMany({
    where: {
      read: false,
      user: { userOrganizations: { some: { orgId } } },
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getOrganizationUserNotifications(orgId: string, userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: {
      userId,
      user: { userOrganizations: { some: { orgId } } },
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getOrganizationUnreadCount(orgId: string) {
  return prisma.notification.count({
    where: {
      read: false,
      user: { userOrganizations: { some: { orgId } } },
    },
  })
}

export async function getOrganizationNotificationStats(orgId: string) {
  const [total, unread, byType, uniqueUsers] = await Promise.all([
    prisma.notification.count({
      where: { user: { userOrganizations: { some: { orgId } } } },
    }),
    prisma.notification.count({
      where: { read: false, user: { userOrganizations: { some: { orgId } } } },
    }),
    prisma.notification.groupBy({
      by: ['type'],
      where: { user: { userOrganizations: { some: { orgId } } } },
      _count: { type: true },
    }),
    prisma.notification.groupBy({
      by: ['userId'],
      where: { user: { userOrganizations: { some: { orgId } } } },
    }),
  ])

  return {
    total,
    unread,
    read: total - unread,
    byType: byType.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = item._count.type
      return acc
    }, {}),
    uniqueUsers: uniqueUsers.length,
  }
}
