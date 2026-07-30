import { prisma } from '@/lib/prisma'

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

export async function getSubscriptionStats() {
  const [totalSubscriptions, activeSubscriptions, expiredSubscriptions, uniqueUsers] =
    await Promise.all([
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      }),
      prisma.pushSubscription.count({ where: { expiresAt: { lte: new Date() } } }),
      prisma.pushSubscription.groupBy({ by: ['userId'] }),
    ])

  return { totalSubscriptions, activeSubscriptions, expiredSubscriptions, uniqueUsers: uniqueUsers.length }
}
