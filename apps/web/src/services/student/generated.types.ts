// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts student
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getStudentsStats, enrollStudent, removeEnrollment, assignStudentGroup, deleteStudentGroup, getStudentProfile, getStudentSchedules, getStudentStats, getStudentActiveSession, getStudentSessionDetail, getStudentByIdForDirection, getParentsForDirection, getEnrolledStudents, getDirectionStudents } from './database'

export type GetStudentsStatsDto = Awaited<ReturnType<typeof getStudentsStats>>
export type EnrollStudentDto = Awaited<ReturnType<typeof enrollStudent>>
export type RemoveEnrollmentDto = Awaited<ReturnType<typeof removeEnrollment>>
export type AssignStudentGroupDto = Awaited<ReturnType<typeof assignStudentGroup>>
export type DeleteStudentGroupDto = Awaited<ReturnType<typeof deleteStudentGroup>>
export type GetStudentProfileDto = Awaited<ReturnType<typeof getStudentProfile>>
export type GetStudentSchedulesDto = Awaited<ReturnType<typeof getStudentSchedules>>
export type GetStudentStatsDto = Awaited<ReturnType<typeof getStudentStats>>
export type GetStudentActiveSessionDto = Awaited<ReturnType<typeof getStudentActiveSession>>
export type GetStudentSessionDetailDto = Awaited<ReturnType<typeof getStudentSessionDetail>>
export type GetStudentByIdForDirectionDto = Awaited<ReturnType<typeof getStudentByIdForDirection>>
export type GetParentsForDirectionDto = Awaited<ReturnType<typeof getParentsForDirection>>
export type GetEnrolledStudentsDto = Awaited<ReturnType<typeof getEnrolledStudents>>
export type GetDirectionStudentsDto = Awaited<ReturnType<typeof getDirectionStudents>>
