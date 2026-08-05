'use server'
import { getUserInfo } from '@/modules/user'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getEnrolledStudents, getStudentProfile, getStudentSchedules, getStudentStats } from '../database'

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
