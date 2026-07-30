import { prisma } from '@/lib/prisma'

const SUBSCRIPTION_TTL_MS = 90 * 24 * 60 * 60 * 1000 // 90 jours

export async function upsertPushSubscription(params: {
  userId: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
  deviceId?: string
}) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: params.endpoint },
    update: {
      userId: params.userId,
      p256dh: params.p256dh,
      auth: params.auth,
      userAgent: params.userAgent,
      deviceId: params.deviceId,
    },
    create: {
      userId: params.userId,
      endpoint: params.endpoint,
      p256dh: params.p256dh,
      auth: params.auth,
      userAgent: params.userAgent,
      deviceId: params.deviceId,
      expiresAt: new Date(Date.now() + SUBSCRIPTION_TTL_MS),
    },
    select: { id: true, endpoint: true, createdAt: true },
  })
}

export async function unsubscribeDevice(params: { userId: string; endpoint: string }) {
  return prisma.pushSubscription.delete({
    where: { endpoint_userId: { endpoint: params.endpoint, userId: params.userId } },
  })
}

export async function unsubscribeAllDevices(userId: string) {
  return prisma.pushSubscription.deleteMany({ where: { userId } })
}

export async function markSubscriptionExpired(endpoint: string) {
  return prisma.pushSubscription.update({
    where: { endpoint },
    data: { expiresAt: new Date() },
  })
}

export async function cleanupExpiredSubscriptions() {
  return prisma.pushSubscription.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
