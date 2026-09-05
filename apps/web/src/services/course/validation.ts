// src/services/course/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateCourseData, UpdateCourseData } from './types'

export const createCourseSchema = object({
  ueCourseId: pipe(string(), uuid('ID matière invalide')),
  classId:    pipe(string(), uuid('ID classe invalide')),
  termId:     optional(pipe(string(), uuid('ID période invalide'))),
  name:       optional(pipe(string(), trim(), minLength(1), maxLength(100))),
} satisfies Record<keyof CreateCourseData, unknown>)

export const updateCourseDataSchema = object({
  name:        optional(pipe(string(), trim(), minLength(1), maxLength(100))),
  description: optional(pipe(string(), trim(), maxLength(500))),
} satisfies Record<keyof UpdateCourseData, unknown>)

export const updateCourseSchema = validateWithId('courseId', updateCourseDataSchema)

export type CreateCourseInput  = InferInput<typeof createCourseSchema>
export type CreateCourseOutput = InferOutput<typeof createCourseSchema>

export type UpdateCourseDataInput = InferInput<typeof updateCourseDataSchema>
export type UpdateCourseDataOutput = InferOutput<typeof updateCourseDataSchema>

export type UpdateCourseInput  = InferInput<typeof updateCourseSchema>
export type UpdateCourseOutput = InferOutput<typeof updateCourseSchema>


// ─────────────────────────────────────────────────────────────────────────────
// À AJOUTER dans src/services/course/validation.ts (à la suite des schémas
// existants — createCourseSchema, updateCourseSchema, etc.)
// ─────────────────────────────────────────────────────────────────────────────
//
// Pas de `satisfies Record<keyof CreateCourseData, unknown>` ici : contrairement
// à createCourseSchema (qui valide un payload 1:1 avec Course), ce schéma valide
// une opération d'ORCHESTRATION — programId/classId référencent d'autres modèles,
// termsBySemester est une map calculée par l'appelant, aucun de ces champs n'est
// un champ direct de Course. Validation manuelle, explicite.

import * as v from 'valibot'

export const generateCoursesFromProgramSchema = v.object({
  programId: v.pipe(v.string(), v.uuid('ID de programme invalide')),
  classId:   v.pipe(v.string(), v.uuid('ID de classe invalide')),

  // Optionnel : map ProgramUE.semester (clé, sérialisée en string par JSON —
  // d'où la validation par regex plutôt que v.number()) → Term.id de la classe
  // cible. Fourni par l'appelant (orchestrateur applyProgramTemplate) quand les
  // Terms de la classe existent déjà ; omis sinon (cours créés sans termId).
  termsBySemester: v.optional(
    v.record(
      v.pipe(v.string(), v.regex(/^\d+$/, 'Semestre invalide')),
      v.pipe(v.string(), v.uuid('ID de période invalide')),
    ),
  ),
})

export type GenerateCoursesFromProgramInput  = v.InferInput<typeof generateCoursesFromProgramSchema>  // Input UI
export type GenerateCoursesFromProgramOutput = v.InferOutput<typeof generateCoursesFromProgramSchema> // Output validé

export const linkCoursesToTermSchema = v.object({
  courseIds: v.pipe(
    v.array(v.pipe(v.string(), v.uuid('ID de cours invalide'))),
    v.minLength(1, 'Au moins un cours requis'),
  ),
  termId: v.nullable(v.pipe(v.string(), v.uuid('ID de semestre invalide'))),
})

export type LinkCoursesToTermInput  = v.InferInput<typeof linkCoursesToTermSchema>
export type LinkCoursesToTermOutput = v.InferOutput<typeof linkCoursesToTermSchema>
