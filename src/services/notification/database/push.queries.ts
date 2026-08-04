import { prisma } from '@/lib/prisma'

// ─── Subscriptions d'un utilisateur ──────────────────────────────────────────

export async function getPushSubscriptionsByUserId(userId: string) {
  return prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
      userAgent: true,
      deviceId: true,
      expiresAt: true,
      createdAt: true,
    },
  })
}

export async function getActivePushSubscriptionsByUserId(userId: string) {
  return prisma.pushSubscription.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
      userAgent: true,
    },
  })
}

export async function findPushSubscriptionByEndpoint(endpoint: string) {
  return prisma.pushSubscription.findUnique({
    where: { endpoint },
    select: {
      id: true,
      userId: true,
      endpoint: true,
      expiresAt: true,
    },
  })
}

export async function countActiveDevicesForUser(userId: string) {
  return prisma.pushSubscription.count({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  })
}

export async function hasActiveSubscriptions(userId: string) {
  const count = await countActiveDevicesForUser(userId)
  return count > 0
}

// ─── Stats globales (admin) ───────────────────────────────────────────────────

export async function getPushSubscriptionStats() {
  const now = new Date()
  const [totalSubscriptions, activeSubscriptions, expiredSubscriptions, uniqueUsers] =
    await Promise.all([
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
      prisma.pushSubscription.count({ where: { expiresAt: { lte: now } } }),
      prisma.pushSubscription.groupBy({ by: ['userId'] }),
    ])

  return {
    totalSubscriptions,
    activeSubscriptions,
    expiredSubscriptions,
    uniqueUsers: uniqueUsers.length,
  }
}
