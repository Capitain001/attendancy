// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts schedule
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createSchedule, updateSchedule, removeSchedule, restoreSchedule, claimScheduleAnnouncement, getScheduleForNotify, getScheduleNotificationContext, removeSchedulesByRule, removeNextSchedulesByRule, toggleScheduleLock, getSchedules, getDaySchedules, getClassSchedules, getTeacherSchedules, getRoomSchedules, getSchedulesByClass, getSchedulesByCourse, getScheduleDays, getTeacherNextSchedule, getTodayClassSchedules, getTeacherDailySchedule, assertClassInOrg, getTeacherSchedulesInfo, getCourseLastSchedule } from './database'

export type CreateScheduleDto = Awaited<ReturnType<typeof createSchedule>>
export type UpdateScheduleDto = Awaited<ReturnType<typeof updateSchedule>>
export type RemoveScheduleDto = Awaited<ReturnType<typeof removeSchedule>>
export type RestoreScheduleDto = Awaited<ReturnType<typeof restoreSchedule>>
export type ClaimScheduleAnnouncementDto = Awaited<ReturnType<typeof claimScheduleAnnouncement>>
export type GetScheduleForNotifyDto = Awaited<ReturnType<typeof getScheduleForNotify>>
export type GetScheduleNotificationContextDto = Awaited<ReturnType<typeof getScheduleNotificationContext>>
export type RemoveSchedulesByRuleDto = Awaited<ReturnType<typeof removeSchedulesByRule>>
export type RemoveNextSchedulesByRuleDto = Awaited<ReturnType<typeof removeNextSchedulesByRule>>
export type ToggleScheduleLockDto = Awaited<ReturnType<typeof toggleScheduleLock>>
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
export type GetTeacherDailyScheduleDto = Awaited<ReturnType<typeof getTeacherDailySchedule>>
export type AssertClassInOrgDto = Awaited<ReturnType<typeof assertClassInOrg>>
export type GetTeacherSchedulesInfoDto = Awaited<ReturnType<typeof getTeacherSchedulesInfo>>
export type GetCourseLastScheduleDto = Awaited<ReturnType<typeof getCourseLastSchedule>>
