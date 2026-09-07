'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getUserDevices, getUserSessions } from '../database'

export async function getMyDevicesAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await getUserDevices(user.id) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getMySessionsAction(input?: { deviceId?: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await getUserSessions(user.id, input?.deviceId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}