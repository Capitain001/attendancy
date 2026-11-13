// src/services/notification/database/notification.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { CACHE } from '@/cache/server/key'
import type { InboxFilter } from '../validation'

const NOTIFICATION_SELECT = {
  id: true,
  message: true,
  resourceType: true,
  resourceId: true,
  event: true,
  read: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.NotificationSelect

// ─── Boîte de réception (Inbox) ───────────────────────────────────────────────

export async function getInboxNotificationsForUser(
  userId: string,
  filter: InboxFilter = 'all',
  limit = 20,
  cursor?: string,
) {
  const whereClause: Prisma.NotificationWhereInput = { userId }

  if (filter === 'unread') {
    whereClause.read = false
  } else if (filter === 'invitations') {
    whereClause.resourceType = 'INVITATION'
  } else if (filter === 'system') {
    whereClause.OR = [
      { resourceType: null },
      { resourceType: { not: 'INVITATION' } },
    ]
  }

  return prisma.notification.findMany({
    where: whereClause,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: NOTIFICATION_SELECT,
  })
}

// ─── Notifications utilisateur ────────────────────────────────────────────────

export async function getNotificationsForUser(userId: string, limit = 20) {
  'use cache'
  cacheTag(CACHE.NOTIFICATION(userId))
  cacheLife(CACHE.NOTIFICATION.life)
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: NOTIFICATION_SELECT,
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
    select: NOTIFICATION_SELECT,
  })
}

export async function getUnreadCountForUser(userId: string) {
  'use cache'
  try {
    cacheTag(CACHE.NOTIFICATION(userId))
    cacheLife(CACHE.NOTIFICATION.life)
  } catch {
    // Non bloquant hors environnement Next.js runtime
  }
  return prisma.notification.count({ where: { userId, read: false } })
}

// ─── Notifications admin (scope organisation) ─────────────────────────────────

export async function getOrganizationNotifications(orgId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { orgId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getOrganizationUnreadNotifications(orgId: string, limit = 50) {
  return prisma.notification.findMany({
    where: {
      orgId,
      read: false,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getOrganizationUserNotifications(orgId: string, userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: {
      orgId,
      userId,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getOrganizationUnreadCount(orgId: string) {
  return prisma.notification.count({
    where: {
      orgId,
      read: false,
    },
  })
}

export async function getOrganizationNotificationStats(orgId: string) {
  const whereOrg = { orgId } as const

  const [total, unread, byType, uniqueUsers] = await Promise.all([
    prisma.notification.count({ where: whereOrg }),
    prisma.notification.count({ where: { ...whereOrg, read: false } }),
    prisma.notification.groupBy({
      by: ['resourceType'],
      where: whereOrg,
      _count: { _all: true },
    }),
    prisma.notification.groupBy({
      by: ['userId'],
      where: whereOrg,
    }),
  ])

  const byTypeMap = byType.reduce<Record<string, number>>((acc, item) => {
    acc[item.resourceType ?? 'GENERAL'] = item._count._all
    return acc
  }, {})

  return {
    total,
    unread,
    read: total - unread,
    byType: byTypeMap,
    uniqueUsers: uniqueUsers.length,
  }
}
