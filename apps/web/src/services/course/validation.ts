// src/services/course/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, number, integer, minValue, boolean, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createCourseSchema = object({
  ueCourseId: pipe(string(), uuid('ID matière invalide')),
  classId:    pipe(string(), uuid('ID classe invalide')),
  termId:     optional(pipe(string(), uuid('ID période invalide'))),
  name:       optional(pipe(string(), trim(), minLength(1), maxLength(100))),
})

export type CreateCourseInput  = InferInput<typeof createCourseSchema>
export type CreateCourseOutput = InferOutput<typeof createCourseSchema>

export const assignTeacherSchema = object({
  courseId:  pipe(string(), uuid('ID cours invalide')),
  teacherId: pipe(string(), uuid('ID enseignant invalide')),
  isMain:    optional(boolean()),
  hours:     optional(pipe(number(), integer(), minValue(1))),
})

export type AssignTeacherInput  = InferInput<typeof assignTeacherSchema>
export type AssignTeacherOutput = InferOutput<typeof assignTeacherSchema>
