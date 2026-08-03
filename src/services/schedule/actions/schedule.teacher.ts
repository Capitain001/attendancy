'use server'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import { getTeacherNextSchedule } from '@/services/session/database'

export async function getTeacherNextScheduleAction({ teacherId }: { teacherId: string }) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getTeacherNextSchedule(teacherId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
