import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/db'
import { CACHE } from '@/cache/server/key'

const eventSelect = {
  id: true, title: true, description: true,
  startTime: true, endTime: true, location: true,
  type: true, color: true, isPublic: true, status: true,
  targetRoles: true,
  createdAt: true,
  createdBy: { select: { firstName: true, lastName: true, email: true } },
  _count: { select: { participants: true } },
} as const

export async function getEvents(orgId: string) {
  'use cache'
  cacheTag(CACHE.EVENT(orgId))
  cacheLife(CACHE.EVENT.life)
  return prisma.event.findMany({
    where: { orgId, deletedAt: null },
    select: eventSelect,
    orderBy: { startTime: 'asc' },
  })
}

export async function getEvent(eventId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.EVENT(orgId))
  cacheTag(CACHE.EVENT(orgId, eventId))
  cacheLife(CACHE.EVENT.life)
  return prisma.event.findFirst({
    where: { id: eventId, orgId, deletedAt: null },
    select: {
      ...eventSelect,
      participants: {
        select: {
          id: true, role: true, status: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  })
}
