'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  getSchedulesByClass,
  getSchedules,
  getScheduleDays,
  getSchedulesByCourse,
  getDaySchedules,
  getTeacherNextSchedule,
  getTodayClassSchedules,
  type ScheduleFilterParams,
} from '../database'
import { getCoursesByClass } from '@/services/course/database'
import { getGroupsByClass } from '@/services/group/database'
import { getRooms } from '@/services/room/database'

export async function getClassSchedulesAction(
  classId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getSchedulesByClass(classId, orgId, rangeStart, rangeEnd) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getSchedulesAction(
  params: Omit<ScheduleFilterParams, 'orgId'>,
) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getSchedules({ orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getDaySchedulesAction(
  params: Omit<ScheduleFilterParams, 'orgId'>,
) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getDaySchedules({ orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getCourseScheduleAction(courseId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getSchedulesByCourse(courseId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getScheduleDaysAction(month: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getScheduleDays(orgId, month) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTeacherNextScheduleAction({ teacherId }: { teacherId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getTeacherNextSchedule(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getTodayClassSchedulesAction(classId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getTodayClassSchedules(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getClassScheduleOptionsAction(classId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const [courses, rooms, groups] = await Promise.all([
      getCoursesByClass(classId, orgId),
      getRooms(orgId),
      getGroupsByClass(classId, orgId),
    ])

    return {
      data: {
        courses: courses.map((c) => ({
          id:      c.id,
          name:    c.name,
          teachers: c.teachers
            .filter((ct): ct is typeof ct & { teacher: NonNullable<typeof ct.teacher> } => ct.teacher !== null)
            .map((ct) => ({
              id:     ct.teacher.id,
              name:   [ct.teacher.user.firstName, ct.teacher.user.lastName].filter(Boolean).join(' '),
              isMain: ct.isMain,
            })),
        })),
        rooms:  rooms.map((r) => ({ id: r.id, name: r.name })),
        groups: groups.map((g) => ({ id: g.id, name: g.name })),
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
