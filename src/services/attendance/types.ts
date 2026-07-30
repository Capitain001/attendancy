import { getScheduleAttendances, getOrgTodayAbsences } from './database/attendance.queries'

export type ScheduleAttendanceDTO = Awaited<ReturnType<typeof getScheduleAttendances>>[number]
export type OrgTodayAbsenceItem   = Awaited<ReturnType<typeof getOrgTodayAbsences>>[number]
