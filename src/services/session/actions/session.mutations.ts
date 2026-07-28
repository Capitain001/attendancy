'use server'
import { ERRORS } from '@/config'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { invalidateEvent } from '@/cache/server/key'
import { startSession, finalizeSession } from '../database'

export async function startSessionAction(
  scheduleId: string,
  coords: { lat: number; lng: number } | null,
) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'TEACHER')
    if (!auth.success) return { error: auth.error }
    const data = await startSession(scheduleId, coords)
    invalidateEvent('SESSION_STARTED', orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function completeSessionAction(scheduleId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'TEACHER')
    if (!auth.success) return { error: auth.error }
    const data = await finalizeSession(scheduleId)
    invalidateEvent('SESSION_COMPLETED', orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
