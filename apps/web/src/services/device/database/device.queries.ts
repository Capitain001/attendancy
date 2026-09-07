import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getUserDevices(userId: string) {
  'use cache'
  cacheTag(CACHE.USER_DEVICES(userId))
  cacheLife('minutes')

  return prisma.userDevice.findMany({
    where: { userId },
    select: {
      id: true,
      deviceId: true,
      deviceType: true,
      os: true,
      osVersion: true,
      browser: true,
      browserVersion: true,
      label: true,
      isTrusted: true,
      firstSeenAt: true,
      lastSeenAt: true,
      lastIpAddress: true,
      revokedAt: true,
    },
    orderBy: { lastSeenAt: 'desc' },
  })
}

export async function getUserSessions(userId: string, deviceId?: string) {
  'use cache'
  cacheTag(CACHE.USER_SESSIONS(userId))
  cacheLife('minutes')

  return prisma.userSession.findMany({
    where: { userId, ...(deviceId ? { deviceId } : {}) },
    select: {
      id: true,
      status: true,
      ipAddress: true,
      orgId: true,
      createdAt: true,
      lastActivityAt: true,
      revokedAt: true,
      revokedReason: true,
      device: {
        select: { id: true, browser: true, os: true, deviceType: true },
      },
    },
    orderBy: { lastActivityAt: 'desc' },
    take: 50,
  })
}

export async function getSession(sessionId: string) {
  'use cache'
  cacheTag(CACHE.USER_SESSION(sessionId))
  cacheLife('minutes')

  return prisma.userSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, orgId: true, status: true, authSessionId: true },
  })
}