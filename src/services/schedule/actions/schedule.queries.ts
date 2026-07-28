'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { getSchedulesByClass, getSchedules, getScheduleDays } from '../database'
import { getCoursesByClass } from '@/services/course/database'
import { getGroupsByClass } from '@/services/group/database'
import { getRooms } from '@/services/room/database'

export async function getClassSchedulesAction(
  classId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    return { data: await getSchedulesByClass(classId, orgId, rangeStart, rangeEnd) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getSchedulesAction(params: {
  classId?:   string
  teacherId?: string
  roomId?:    string
  rangeStart: Date
  rangeEnd:   Date
}) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    return { data: await getSchedules(orgId, params) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

/** Jours (yyyy-MM-dd) ayant au moins une séance pour un mois "yyyy-MM". */
export async function getScheduleDaysAction(month: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getScheduleDays(orgId, month) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

/** Options pour le formulaire de création de séance (cours + salles + groupes de la classe). */
export async function getClassScheduleOptionsAction(classId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

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
          teachers: c.teachers.map((ct) => ({
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
