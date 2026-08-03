'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getTeachers, getTeacher, getTeacherTodaySchedules, getTeacherSchedules, getTeacherCourses, getTeacherStats, getTeacherOrganizationStats } from '../database'

export async function getCurrentTeacherId(): Promise<string | null> {
  const auth = await authAccess()
  if (!auth.data) return null
  return auth.data.user?.organization?.teacherId ?? null
}

export async function getTeacherSchedulesAction(
  teacherId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await getTeacherSchedules(teacherId, orgId, rangeStart, rangeEnd) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherTodaySchedulesAction(teacherId: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await getTeacherTodaySchedules(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherCoursesAction(teacherId: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const rows = await getTeacherCourses(teacherId, orgId)
    return rows.map(r => ({ id: r.course.id, name: r.course.name, class: r.course.class }))
  } catch {
    return []
  }
}

export async function getTeacherStatsAction(teacherId: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await getTeacherStats(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeachersAction(departmentId?: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await getTeachers(orgId, departmentId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherAction(teacherId: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await getTeacher(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherOrganizationStatsAction() {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await getTeacherOrganizationStats(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}