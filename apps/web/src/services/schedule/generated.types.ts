// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts schedule
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getSchedules, getDaySchedules, getClassSchedules, getTeacherSchedules, getRoomSchedules, getSchedulesByClass, getSchedulesByCourse, getScheduleDays, getTeacherNextSchedule, getTodayClassSchedules, assertClassInOrg } from './database'

export type GetSchedulesDto = Awaited<ReturnType<typeof getSchedules>>
export type GetDaySchedulesDto = Awaited<ReturnType<typeof getDaySchedules>>
export type GetClassSchedulesDto = Awaited<ReturnType<typeof getClassSchedules>>
export type GetTeacherSchedulesDto = Awaited<ReturnType<typeof getTeacherSchedules>>
export type GetRoomSchedulesDto = Awaited<ReturnType<typeof getRoomSchedules>>
export type GetSchedulesByClassDto = Awaited<ReturnType<typeof getSchedulesByClass>>
export type GetSchedulesByCourseDto = Awaited<ReturnType<typeof getSchedulesByCourse>>
export type GetScheduleDaysDto = Awaited<ReturnType<typeof getScheduleDays>>
export type GetTeacherNextScheduleDto = Awaited<ReturnType<typeof getTeacherNextSchedule>>
export type GetTodayClassSchedulesDto = Awaited<ReturnType<typeof getTodayClassSchedules>>
export type AssertClassInOrgDto = Awaited<ReturnType<typeof assertClassInOrg>>
