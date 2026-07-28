'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getEnrolledStudents, getStudentProfile, getStudentSchedules, getStudentStats } from '../database'

function getStudentCtx(user: Awaited<ReturnType<typeof getUserInfo>>) {
  return {
    studentId: user?.organization?.studentId ?? null,
    orgId:     user?.organization?.id         ?? null,
  }
}

export async function getCurrentStudentId(): Promise<string | null> {
  const user = await getUserInfo()
  return user?.organization?.studentId ?? null
}

export async function getStudentProfileAction() {
  try {
    const user = await getUserInfo()
    const { studentId, orgId } = getStudentCtx(user)
    if (!studentId) return { error: 'Profil étudiant introuvable' }
    if (!orgId)     return { error: ERRORS.ORG.NOT_FOUND }
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
  try {
    const user = await getUserInfo()
    const { orgId } = getStudentCtx(user)
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getStudentSchedules(params.groupIds, { orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentStatsAction(params: { classId: string; groupIds: string[] }) {
  try {
    const user = await getUserInfo()
    const { studentId, orgId } = getStudentCtx(user)
    if (!studentId) return { error: 'Profil étudiant introuvable' }
    if (!orgId)     return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getStudentStats({ studentId, orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getEnrolledStudentsAction(classId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getEnrolledStudents(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
