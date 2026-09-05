// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts student-enrollment
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createStudentEnrollment, removeStudentEnrollment, updateStudentEnrollment, transferStudentEnrollment, enrollStudentsInClass, getStudentsEnrollments, getStudentEnrollmentDetails, getStudentEnrollmentByClass, searchStudentsForEnrollment } from './database'

export type CreateStudentEnrollmentDto = Awaited<ReturnType<typeof createStudentEnrollment>>
export type RemoveStudentEnrollmentDto = Awaited<ReturnType<typeof removeStudentEnrollment>>
export type UpdateStudentEnrollmentDto = Awaited<ReturnType<typeof updateStudentEnrollment>>
export type TransferStudentEnrollmentDto = Awaited<ReturnType<typeof transferStudentEnrollment>>
export type EnrollStudentsInClassDto = Awaited<ReturnType<typeof enrollStudentsInClass>>
export type GetStudentsEnrollmentsDto = Awaited<ReturnType<typeof getStudentsEnrollments>>
export type GetStudentEnrollmentDetailsDto = Awaited<ReturnType<typeof getStudentEnrollmentDetails>>
export type GetStudentEnrollmentByClassDto = Awaited<ReturnType<typeof getStudentEnrollmentByClass>>
export type SearchStudentsForEnrollmentDto = Awaited<ReturnType<typeof searchStudentsForEnrollment>>
