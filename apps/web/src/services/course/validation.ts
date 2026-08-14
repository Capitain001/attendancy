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
