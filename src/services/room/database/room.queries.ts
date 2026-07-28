// src/services/room/database/room.queries.ts
import { prisma } from '@/lib/db'

export async function getRooms(orgId: string) {
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
  return prisma.location.findMany({
    where: { orgId },
    select: { id: true, name: true, address: true, active: true, radius: true },
    orderBy: { name: 'asc' },
  })
}
