// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts schedule
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import type { createSchedule, updateSchedule, removeSchedule, restoreSchedule, markScheduleCreationNotified, getScheduleForNotify, removeSchedulesByRule, removeNextSchedulesByRule, toggleScheduleLock, getSchedules, getDaySchedules, getClassSchedules, getTeacherSchedules, getRoomSchedules, getSchedulesByClass, getSchedulesByCourse, getScheduleDays, getTeacherNextSchedule, getTodayClassSchedules, getTeacherDailySchedule, assertClassInOrg, getTeacherSchedulesInfo, getCourseLastSchedule } from './database'
import type { createScheduleAction, updateScheduleAction, cancelScheduleAction, removeScheduleAction, deleteScheduleAction, restoreScheduleAction, notifyScheduleCreationAction, notifyScheduleCreationsAction, toggleScheduleLockAction, getClassSchedulesAction, getSchedulesAction, getDaySchedulesAction, getCourseScheduleAction, getScheduleDaysAction, getTeacherNextScheduleAction, getTodayClassSchedulesAction, getClassScheduleOptionsAction, getTeacherSchedulesAction, getTeacherSchedulesInfoAction, getCourseLastScheduleAction, getTeacherDailyScheduleAction } from './actions'

export type CreateScheduleDto = Awaited<ReturnType<typeof createSchedule>>
export type UpdateScheduleDto = Awaited<ReturnType<typeof updateSchedule>>
export type RemoveScheduleDto = Awaited<ReturnType<typeof removeSchedule>>
export type RestoreScheduleDto = Awaited<ReturnType<typeof restoreSchedule>>
export type MarkScheduleCreationNotifiedDto = Awaited<ReturnType<typeof markScheduleCreationNotified>>
export type GetScheduleForNotifyDto = Awaited<ReturnType<typeof getScheduleForNotify>>
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
export type CreateScheduleActionInput = Parameters<typeof createScheduleAction>[0]
export type CreateScheduleActionOutput = Awaited<ReturnType<typeof createScheduleAction>>
export type UpdateScheduleActionInput = Parameters<typeof updateScheduleAction>[0]
export type UpdateScheduleActionOutput = Awaited<ReturnType<typeof updateScheduleAction>>
export type CancelScheduleActionInput = Parameters<typeof cancelScheduleAction>[0]
export type CancelScheduleActionOutput = Awaited<ReturnType<typeof cancelScheduleAction>>
export type RemoveScheduleActionInput = Parameters<typeof removeScheduleAction>[0]
export type RemoveScheduleActionOutput = Awaited<ReturnType<typeof removeScheduleAction>>
export type DeleteScheduleActionInput = Parameters<typeof deleteScheduleAction>[0]
export type DeleteScheduleActionOutput = Awaited<ReturnType<typeof deleteScheduleAction>>
export type RestoreScheduleActionInput = Parameters<typeof restoreScheduleAction>[0]
export type RestoreScheduleActionOutput = Awaited<ReturnType<typeof restoreScheduleAction>>
export type NotifyScheduleCreationActionInput = Parameters<typeof notifyScheduleCreationAction>[0]
export type NotifyScheduleCreationActionOutput = Awaited<ReturnType<typeof notifyScheduleCreationAction>>
export type NotifyScheduleCreationsActionInput = Parameters<typeof notifyScheduleCreationsAction>[0]
export type NotifyScheduleCreationsActionOutput = Awaited<ReturnType<typeof notifyScheduleCreationsAction>>
export type ToggleScheduleLockActionInput = Parameters<typeof toggleScheduleLockAction>[0]
export type ToggleScheduleLockActionOutput = Awaited<ReturnType<typeof toggleScheduleLockAction>>
export type GetClassSchedulesActionInput = Parameters<typeof getClassSchedulesAction>[0]
export type GetClassSchedulesActionOutput = Awaited<ReturnType<typeof getClassSchedulesAction>>
export type GetSchedulesActionInput = Parameters<typeof getSchedulesAction>[0]
export type GetSchedulesActionOutput = Awaited<ReturnType<typeof getSchedulesAction>>
export type GetDaySchedulesActionInput = Parameters<typeof getDaySchedulesAction>[0]
export type GetDaySchedulesActionOutput = Awaited<ReturnType<typeof getDaySchedulesAction>>
export type GetCourseScheduleActionInput = Parameters<typeof getCourseScheduleAction>[0]
export type GetCourseScheduleActionOutput = Awaited<ReturnType<typeof getCourseScheduleAction>>
export type GetScheduleDaysActionInput = Parameters<typeof getScheduleDaysAction>[0]
export type GetScheduleDaysActionOutput = Awaited<ReturnType<typeof getScheduleDaysAction>>
export type GetTeacherNextScheduleActionInput = Parameters<typeof getTeacherNextScheduleAction>[0]
export type GetTeacherNextScheduleActionOutput = Awaited<ReturnType<typeof getTeacherNextScheduleAction>>
export type GetTodayClassSchedulesActionInput = Parameters<typeof getTodayClassSchedulesAction>[0]
export type GetTodayClassSchedulesActionOutput = Awaited<ReturnType<typeof getTodayClassSchedulesAction>>
export type GetClassScheduleOptionsActionInput = Parameters<typeof getClassScheduleOptionsAction>[0]
export type GetClassScheduleOptionsActionOutput = Awaited<ReturnType<typeof getClassScheduleOptionsAction>>
export type GetTeacherSchedulesActionInput = Parameters<typeof getTeacherSchedulesAction>[0]
export type GetTeacherSchedulesActionOutput = Awaited<ReturnType<typeof getTeacherSchedulesAction>>
export type GetTeacherSchedulesInfoActionInput = Parameters<typeof getTeacherSchedulesInfoAction>[0]
export type GetTeacherSchedulesInfoActionOutput = Awaited<ReturnType<typeof getTeacherSchedulesInfoAction>>
export type GetCourseLastScheduleActionInput = Parameters<typeof getCourseLastScheduleAction>[0]
export type GetCourseLastScheduleActionOutput = Awaited<ReturnType<typeof getCourseLastScheduleAction>>
export type GetTeacherDailyScheduleActionInput = Parameters<typeof getTeacherDailyScheduleAction>[0]
export type GetTeacherDailyScheduleActionOutput = Awaited<ReturnType<typeof getTeacherDailyScheduleAction>>
