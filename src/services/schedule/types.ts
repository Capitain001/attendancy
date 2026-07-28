import type { getTeacherNextSchedule } from '@/services/session/database'
import type { getSchedules } from './database'

export type TeacherNextSchedule = Awaited<ReturnType<typeof getTeacherNextSchedule>>
export type GetSchedulesReturn = Awaited<ReturnType<typeof getSchedules>>
