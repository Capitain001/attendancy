// src/services/ue-course/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, number, minValue, maxValue, integer, uuid, nullable } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createUECourseSchema = object({
  name:        pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  code:        optional(pipe(string(), trim(), maxLength(20))),
  description: optional(pipe(string(), trim(), maxLength(500))),
  credits:     pipe(number(), integer(), minValue(1), maxValue(10)),
  duration:    pipe(number(), integer(), minValue(1), maxValue(200)),
  ueId:        pipe(string(), uuid('ID UE invalide')),
  order:       optional(nullable(number())),
})

export type CreateUECourseInput  = InferInput<typeof createUECourseSchema>
export type CreateUECourseOutput = InferOutput<typeof createUECourseSchema>
