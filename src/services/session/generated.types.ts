// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts session
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getActiveSessions, getOrgDaySchedulesWithSession, getTeacherNextSchedule } from './database'

export type GetActiveSessionsDto = Awaited<ReturnType<typeof getActiveSessions>>
export type GetOrgDaySchedulesWithSessionDto = Awaited<ReturnType<typeof getOrgDaySchedulesWithSession>>
export type GetTeacherNextScheduleDto = Awaited<ReturnType<typeof getTeacherNextSchedule>>
