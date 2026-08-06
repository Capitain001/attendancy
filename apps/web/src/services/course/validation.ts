// src/services/course/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createCourseSchema = object({
  ueCourseId: pipe(string(), uuid('ID matière invalide')),
  classId:    pipe(string(), uuid('ID classe invalide')),
  termId:     optional(pipe(string(), uuid('ID période invalide'))),
  name:       optional(pipe(string(), trim(), minLength(1), maxLength(100))),
})

export type CreateCourseInput  = InferInput<typeof createCourseSchema>
export type CreateCourseOutput = InferOutput<typeof createCourseSchema>
