// src/services/room/actions/room.queries.ts
'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getRooms, getLocations, getRoomById } from '../database'

export async function getRoomsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getRooms(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getRoomAction(roomId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const room = await getRoomById(roomId, orgId)
    if (!room) return { error: 'Salle introuvable' }
    return { data: room }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getLocationsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getLocations(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
