// src/services/room/database/room.mutations.ts
import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'

import type { UpdateRoomDataOutput, CreateRoomOutput, CreateLocationOutput } from '../validation'

export async function createRoom(data: CreateRoomOutput & { orgId: string }) {
  const result = await prisma.room.create({
    data: {
      name: data.name,
      capacity: data.capacity ?? null,
      locationId: data.locationId ?? null,
      equipment: data.equipment ?? [],
      orgId: data.orgId,
    },
    select: { id: true, name: true, capacity: true, equipment: true, locationId: true, location: { select: { id: true, name: true } } },
  })
  await invalidateEvent('ROOM_CREATED', data.orgId)
  return result
}

export async function removeRoom(id: string, orgId: string) {
  const room = await prisma.room.findFirst({ where: { id, orgId, deletedAt: null } })
  if (!room) throw new Error('Salle introuvable')

  const result = await prisma.room.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true },
  })
  await invalidateEvent('ROOM_REMOVED', orgId)
  return result
}

export async function createLocation(data: CreateLocationOutput & { orgId: string }) {
  const result = await prisma.location.create({
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius ?? 50,
      orgId: data.orgId,
    },
    select: { id: true, name: true, address: true },
  })
  await invalidateEvent('ROOM_CREATED', data.orgId)
  return result
}

export async function updateRoom(
  id: string,
  orgId: string,
  data: UpdateRoomDataOutput,
) {
  const existing = await prisma.room.findFirst({ where: { id, orgId, deletedAt: null } })
  if (!existing) throw new Error('Salle introuvable')

  const result = await prisma.room.update({
    where: { id },
    data: {
      ...(data.name       !== undefined && { name:       data.name }),
      ...(data.capacity   !== undefined && { capacity:   data.capacity }),
      ...(data.locationId !== undefined && { locationId: data.locationId }),
      ...(data.equipment  !== undefined && { equipment:  data.equipment }),
    },
    select: { id: true, name: true, capacity: true, equipment: true, locationId: true, location: { select: { id: true, name: true } } },
  })
  await invalidateEvent('ROOM_UPDATED', orgId)
  return result
}

export async function toggleLocationActive(id: string, orgId: string) {
  const loc = await prisma.location.findFirst({ where: { id, orgId } })
  if (!loc) throw new Error('Site introuvable')
  const result = await prisma.location.update({
    where: { id },
    data: { active: !loc.active },
    select: { id: true, active: true },
  })
  await invalidateEvent('ROOM_CREATED', orgId)
  return result
}
