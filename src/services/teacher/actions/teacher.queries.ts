'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getTeachers, getTeacher, getTeacherTodaySchedules, getTeacherSchedules, getTeacherCourses, getTeacherStats, getTeacherOrganizationStats } from '../database'

export async function getCurrentTeacherId(): Promise<string | null> {
  const user = await getUserInfo()
  return user?.organization?.teacherId ?? null
}

export async function getTeacherSchedulesAction(
  teacherId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getTeacherSchedules(teacherId, orgId, rangeStart, rangeEnd) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherTodaySchedulesAction(teacherId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getTeacherTodaySchedules(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherCoursesAction(teacherId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const rows = await getTeacherCourses(teacherId, orgId)
    return rows.map(r => ({ id: r.course.id, name: r.course.name, class: r.course.class }))
  } catch {
    return []
  }
}

export async function getTeacherStatsAction(teacherId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getTeacherStats(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeachersAction(departmentId?: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getTeachers(orgId, departmentId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherAction(teacherId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getTeacher(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherOrganizationStatsAction() {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getTeacherOrganizationStats(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
