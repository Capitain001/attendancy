'use server'
import { startOfDay, endOfDay } from 'date-fns'
import { ERRORS } from '@/config'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { getTeacherNextSchedule, getActiveSessions, getOrgDaySchedulesWithSession } from '../database'

export async function getActiveSessionsAction() {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const data = await getActiveSessions(orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getDirectionSessionsAction() {
  try {
    const user = await getUserInfo()
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, ['DIRECTION', 'ADMIN'])
    if (!auth.success) return { error: auth.error }
    const now = new Date()
    const data = await getOrgDaySchedulesWithSession(orgId, startOfDay(now), endOfDay(now))
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherNextScheduleAction() {
  try {
    const user = await getUserInfo()
    const orgId     = user?.organization?.id
    const teacherId = user?.organization?.teacherId
    if (!orgId)     return { error: ERRORS.ORG.NOT_FOUND }
    if (!teacherId) return { error: 'Profil enseignant introuvable' }
    const data = await getTeacherNextSchedule(teacherId, orgId)
    return { data: data ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
