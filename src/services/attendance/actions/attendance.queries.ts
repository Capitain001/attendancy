'use server'
import { ERRORS } from '@/config'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { getScheduleAttendances, getOrgTodayAbsences } from '../database/attendance.queries'

export async function getOrgTodayAbsencesAction() {
  try {
    const user = await getUserInfo()
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, ['DIRECTION', 'ADMIN'])
    if (!auth.success) return { error: auth.error }
    const data = await getOrgTodayAbsences(orgId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getScheduleAttendancesAction({ scheduleId }: { scheduleId: string }) {
  try {
    const user = await getUserInfo()
    if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const auth = getAuthorization(user, ['TEACHER', 'DIRECTION'])
    if (!auth.success) return { error: auth.error }
    const data = await getScheduleAttendances(scheduleId)
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
