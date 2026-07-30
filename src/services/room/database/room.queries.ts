// src/services/room/database/room.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getRooms(orgId: string) {
  'use cache'
  cacheTag(CACHE.ROOM(orgId))
  cacheLife(CACHE.ROOM.life)
  return prisma.room.findMany({
    where: { orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      capacity: true,
      equipment: true,
      locationId: true,
      location: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getRoomById(id: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.ROOM(orgId))
  cacheLife(CACHE.ROOM.life)
  return prisma.room.findFirst({
    where: { id, orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      capacity: true,
      equipment: true,
      locationId: true,
      location: { select: { id: true, name: true, address: true } },
    },
  })
}

export async function getLocations(orgId: string) {
  'use cache'
  cacheTag(CACHE.ROOM(orgId))
  cacheLife(CACHE.ROOM.life)
  return prisma.location.findMany({
    where: { orgId },
    select: { id: true, name: true, address: true, active: true, radius: true },
    orderBy: { name: 'asc' },
  })
}
