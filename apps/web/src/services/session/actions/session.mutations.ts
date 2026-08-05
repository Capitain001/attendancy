'use server'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { invalidateEvent } from '@/cache/server/key'
import { startSession, finalizeSession } from '../database'

export async function startSessionAction(
  scheduleId: string,
  coords: { lat: number; lng: number } | null,
) {
  const auth = await authAccess({ requiredRole: 'TEACHER' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await startSession(scheduleId, coords)
    invalidateEvent('SESSION_STARTED', orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function completeSessionAction(scheduleId: string) {
  const auth = await authAccess({ requiredRole: 'TEACHER' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const data = await finalizeSession(scheduleId)
    invalidateEvent('SESSION_COMPLETED', orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
