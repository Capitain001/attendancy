// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts student
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getStudentProfile, getStudentSchedules, getStudentStats, getEnrolledStudents } from './database'

export type GetStudentProfileDto = Awaited<ReturnType<typeof getStudentProfile>>
export type GetStudentSchedulesDto = Awaited<ReturnType<typeof getStudentSchedules>>
export type GetStudentStatsDto = Awaited<ReturnType<typeof getStudentStats>>
export type GetEnrolledStudentsDto = Awaited<ReturnType<typeof getEnrolledStudents>>
