import * as v from 'valibot'
import type { CreateStudentEnrollmentData, UpdateStudentEnrollmentData } from './types'
import { validateWithId } from '@/utils/server/validation'

export const createStudentEnrollmentSchema = v.object({
  studentId: v.pipe(v.string(), v.uuid('ID étudiant invalide')),
  classId: v.pipe(v.string(), v.uuid('ID classe invalide')),
  endedAt: v.optional(v.nullable(v.pipe(v.string(), v.isoDateTime('Date de fin invalide')))),
} satisfies Record<keyof CreateStudentEnrollmentData, unknown>)

export type CreateStudentEnrollmentInput = v.InferInput<typeof createStudentEnrollmentSchema>
export type CreateStudentEnrollmentOutput = v.InferOutput<typeof createStudentEnrollmentSchema>

// classId et studentId retirés : une inscription existante ne peut plus
// changer de classe ou de propriétaire via update (cf. types.ts). Seule la
// date de fin reste modifiable ici.
export const updateStudentEnrollmentDataSchema = v.object({
  endedAt: v.optional(v.nullable(v.pipe(v.string(), v.isoDateTime('Date de fin invalide')))),
} satisfies Record<keyof UpdateStudentEnrollmentData, unknown>)

export type UpdateStudentEnrollmentDataInput = v.InferInput<typeof updateStudentEnrollmentDataSchema>
export type UpdateStudentEnrollmentDataOutput = v.InferOutput<typeof updateStudentEnrollmentDataSchema>

export const updateStudentEnrollmentSchema = validateWithId('studentEnrollmentId', updateStudentEnrollmentDataSchema)
export type UpdateStudentEnrollmentInput = v.InferInput<typeof updateStudentEnrollmentSchema>
export type UpdateStudentEnrollmentOutput = v.InferOutput<typeof updateStudentEnrollmentSchema>

// Changement de classe d'un étudiant : traité comme un événement métier à
// part entière (clôture de l'inscription courante + nouvelle inscription),
// jamais comme une mutation de classId sur la ligne existante.
export const transferStudentEnrollmentSchema = v.object({
  studentEnrollmentId: v.pipe(v.string(), v.uuid('ID inscription invalide')),
  studentId: v.pipe(v.string(), v.uuid('ID étudiant invalide')),
  newClassId: v.pipe(v.string(), v.uuid('ID classe invalide')),
})

export type TransferStudentEnrollmentInput = v.InferInput<typeof transferStudentEnrollmentSchema>
export type TransferStudentEnrollmentOutput = v.InferOutput<typeof transferStudentEnrollmentSchema>

// Import en masse (direction) : au moins un étudiant, tous validés en UUID.
export const enrollStudentsInClassSchema = v.object({
  classId: v.pipe(v.string(), v.uuid('ID classe invalide')),
  studentIds: v.pipe(
    v.array(v.pipe(v.string(), v.uuid('ID étudiant invalide'))),
    v.minLength(1, 'Sélectionnez au moins un étudiant'),
  ),
})

export type EnrollStudentsInClassInput = v.InferInput<typeof enrollStudentsInClassSchema>
export type EnrollStudentsInClassOutput = v.InferOutput<typeof enrollStudentsInClassSchema>

// Recherche d'étudiants à inscrire dans une classe donnée — minLength(2) pour
// éviter des scans larges sur une lettre unique.
export const searchStudentsForEnrollmentSchema = v.object({
  classId: v.pipe(v.string(), v.uuid('ID classe invalide')),
  query: v.pipe(v.string(), v.minLength(2, 'Recherche trop courte (2 caractères minimum)')),
})

export type SearchStudentsForEnrollmentInput = v.InferInput<typeof searchStudentsForEnrollmentSchema>
export type SearchStudentsForEnrollmentOutput = v.InferOutput<typeof searchStudentsForEnrollmentSchema>