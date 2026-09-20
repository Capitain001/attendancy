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
  getTeacherSchedules,
  ScheduleDaysFilterParams,
  getTeacherSchedulesInfo,
  getCourseLastSchedule,
} from '../database'
import { getCourses } from '@/services/course/database'
// import { getGroupsByClass } from '@/services/group/database'
import { getRooms } from '@/services/room/database'
import { mockGetTeacherNextSchedule } from '@/data/mocks/mock.schedule'

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

export type GetScheduleDaysInput = {
  month: string
  filters?: ScheduleDaysFilterParams
}

export async function getScheduleDaysAction({ month, filters }: GetScheduleDaysInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const days = await getScheduleDays(orgId, month, filters)
    return { data: days }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}
export async function getTeacherNextScheduleAction({ teacherId }: { teacherId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    // return { data: await getTeacherNextSchedule(teacherId, orgId) }
    return {data: mockGetTeacherNextSchedule}
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
      getCourses(classId, orgId),
      getRooms(orgId),
      getCourses(classId, orgId),
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


export async function getTeacherSchedulesAction(
  params: Omit<ScheduleFilterParams, 'orgId' | 'classId' | 'roomId'>,
) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getTeacherSchedules({ orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

type GetTeacherSchedulesParams = {
  teacherId: string;
  rangeStart: Date;
  rangeEnd: Date;
};

export async function getTeacherSchedulesInfoAction({
  teacherId,
  rangeStart,
  rangeEnd,
}: GetTeacherSchedulesParams) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    return { data: await getTeacherSchedulesInfo(teacherId, orgId, rangeStart, rangeEnd) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getCourseLastScheduleAction(courseId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getCourseLastSchedule(courseId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
