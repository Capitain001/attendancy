import { getScheduleAttendances } from './database/attendance.queries'

export type ScheduleAttendanceDTO = Awaited<ReturnType<typeof getScheduleAttendances>>[number]
