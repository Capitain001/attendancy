'use server'
import { startOfDay, endOfDay } from 'date-fns'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { getTeacherNextSchedule, getActiveSessions, getOrgDaySchedulesWithSession } from '../database'

export async function getActiveSessionsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getActiveSessions(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getDirectionSessionsAction() {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const now = new Date()
    return { data: await getOrgDaySchedulesWithSession(orgId, startOfDay(now), endOfDay(now)) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

/** Sessions de l'org pour une date donnée (ISO string, défaut = aujourd'hui). */
export async function getDirectionSessionsByDateAction(dateStr?: string) {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const date = dateStr ? new Date(dateStr) : new Date()
    return { data: await getOrgDaySchedulesWithSession(orgId, startOfDay(date), endOfDay(date)) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherNextScheduleAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const teacherId = user.organization?.teacherId
  if (!teacherId) return { error: 'Profil enseignant introuvable' }

  try {
    return { data: await getTeacherNextSchedule(teacherId, orgId) ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
