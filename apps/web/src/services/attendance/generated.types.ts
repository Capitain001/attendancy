// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts attendance
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getScheduleAttendances, getStudentAttendances, getUserAttendance, getStudentAttendanceStatusCounts, getOrgStudentAttendanceRates, getStudentAttendanceSummary, getExpectedAttendees } from './database'

export type GetScheduleAttendancesDto = Awaited<ReturnType<typeof getScheduleAttendances>>
export type GetStudentAttendancesDto = Awaited<ReturnType<typeof getStudentAttendances>>
export type GetUserAttendanceDto = Awaited<ReturnType<typeof getUserAttendance>>
export type GetStudentAttendanceStatusCountsDto = Awaited<ReturnType<typeof getStudentAttendanceStatusCounts>>
export type GetOrgStudentAttendanceRatesDto = Awaited<ReturnType<typeof getOrgStudentAttendanceRates>>
export type GetStudentAttendanceSummaryDto = Awaited<ReturnType<typeof getStudentAttendanceSummary>>
export type GetExpectedAttendeesDto = Awaited<ReturnType<typeof getExpectedAttendees>>
