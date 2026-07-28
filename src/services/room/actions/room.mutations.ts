// src/services/room/actions/room.mutations.ts
'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { createRoomSchema, createLocationSchema } from '../validation'
import type { CreateRoomInput, CreateLocationInput } from '../validation'
import { createRoom, softDeleteRoom, createLocation, toggleLocationActive } from '../database'
import { prisma } from '@/lib/db'
import { invalidateEvent } from '@/cache/server/key'

export async function createRoomAction(input: CreateRoomInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const parsed = v.parse(createRoomSchema, input)

    try {
      const room = await createRoom({ ...parsed, orgId })
      return { data: room }
    } catch (e) {
      const isUnique = e instanceof Error && (e.message.includes('Unique constraint') || e.message.includes('P2002'))
      return { error: isUnique ? 'Une salle avec ce nom existe déjà' : 'Erreur lors de la création' }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function deleteRoomAction(roomId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const result = await softDeleteRoom(roomId, orgId)
    return { data: result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export const addRoomAction = createRoomAction

export async function updateRoomAction(roomId: string, data: { name?: string; capacity?: number; locationId?: string; equipment?: string[] }) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const room = await prisma.room.update({
      where: { id: roomId, orgId },
      data: { ...(data.name !== undefined && { name: data.name }), ...(data.capacity !== undefined && { capacity: data.capacity }), ...(data.locationId !== undefined && { locationId: data.locationId }), ...(data.equipment !== undefined && { equipment: data.equipment }) },
      select: { id: true, name: true, capacity: true, equipment: true, locationId: true, location: { select: { id: true, name: true } } },
    })
    await invalidateEvent('ROOM_UPDATED', orgId)
    return { data: room }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function removeRoomAction(roomId: string): Promise<{ success: boolean; error?: string }> {
  const result = await deleteRoomAction(roomId)
  if ('error' in result) return { success: false, error: result.error }
  return { success: true }
}

export async function createLocationAction(input: CreateLocationInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const parsed = v.parse(createLocationSchema, input)
    const loc = await createLocation({ ...parsed, orgId })
    return { data: loc }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function toggleLocationActiveAction(locationId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }

    const result = await toggleLocationActive(locationId, orgId)
    return { data: result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}
