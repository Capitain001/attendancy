// src/services/room/actions/room.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createRoomSchema, createLocationSchema, updateRoomSchema } from '../validation'
import type { CreateRoomInput, CreateLocationInput, UpdateRoomInput } from '../validation'
import { createRoom, removeRoom, updateRoom, createLocation, toggleLocationActive } from '../database'

export async function createRoomAction(input: CreateRoomInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createRoomSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const room = await createRoom({ ...parsed.output, orgId })
    return { data: room }
  } catch (e) {
    const isUnique = e instanceof Error && (e.message.includes('Unique constraint') || e.message.includes('P2002'))
    return { error: isUnique ? 'Une salle avec ce nom existe déjà' : 'Erreur lors de la création' }
  }
}

export async function removeRoomAction(roomId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    await removeRoom(roomId, orgId)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export const addRoomAction = createRoomAction

export async function updateRoomAction(input: UpdateRoomInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updateRoomSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateRoom(parsed.output.roomId, orgId, parsed.output.data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function createLocationAction(input: CreateLocationInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createLocationSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createLocation({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function toggleLocationActiveAction(locationId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await toggleLocationActive(locationId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
