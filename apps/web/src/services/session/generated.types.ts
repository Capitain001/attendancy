// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts session
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { startSession, endSession, finalizeSession, getActiveSessions, getOrgDaySchedulesWithSession, getTeacherNextSchedule, createSessionToken, validateSessionToken } from './database'

export type StartSessionDto = Awaited<ReturnType<typeof startSession>>
export type EndSessionDto = Awaited<ReturnType<typeof endSession>>
export type FinalizeSessionDto = Awaited<ReturnType<typeof finalizeSession>>
export type GetActiveSessionsDto = Awaited<ReturnType<typeof getActiveSessions>>
export type GetOrgDaySchedulesWithSessionDto = Awaited<ReturnType<typeof getOrgDaySchedulesWithSession>>
export type GetTeacherNextScheduleDto = Awaited<ReturnType<typeof getTeacherNextSchedule>>
export type CreateSessionTokenDto = Awaited<ReturnType<typeof createSessionToken>>
export type ValidateSessionTokenDto = Awaited<ReturnType<typeof validateSessionToken>>
