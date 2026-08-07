'use server'
import { getUserInfo } from '@/modules/user'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  getEnrolledStudents, getStudentActiveSession, getStudentProfile,
  getStudentSchedules, getStudentStats, getStudentSessionDetail,
  getStudentByIdForDirection, getParentsForDirection,
} from '../database'

export async function getCurrentStudentId(): Promise<string | null> {
  const user = await getUserInfo()
  return user?.organization?.studentId ?? null
}

export async function getStudentProfileAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  try {
    const profile = await getStudentProfile(studentId, orgId)
    if (!profile) return { error: 'Profil étudiant introuvable' }
    return { data: profile }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentScheduleAction(params: {
  classId: string
  groupIds: string[]
  rangeStart: Date
  rangeEnd: Date
}) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getStudentSchedules(params.groupIds, { orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentStatsAction(params: { classId: string; groupIds: string[] }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  try {
    return { data: await getStudentStats({ studentId, orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentSessionDetailAction(params: { scheduleId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  try {
    const profile = await getStudentProfile(studentId, orgId)
    if (!profile?.classId) return { error: 'Aucune classe associée' }
    const data = await getStudentSessionDetail({
      studentId,
      scheduleId: params.scheduleId,
      orgId,
      classId: profile.classId,
      groupIds: profile.groupIds,
    })
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentActiveSessionAction(params: { classId: string; groupIds: string[] }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  try {
    return { data: await getStudentActiveSession({ studentId, orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getEnrolledStudentsAction(classId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getEnrolledStudents(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentByIdForDirectionAction(studentId: string) {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data
  try {
    const data = await getStudentByIdForDirection(studentId, orgId)
    if (!data) return { error: 'Étudiant introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getParentsForDirectionAction() {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data
  try {
    return { data: await getParentsForDirection(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
