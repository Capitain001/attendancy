// src/services/ue/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, boolean, uuid, number, minValue, maxValue } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createUESchema = object({
  name:         pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  code:         optional(pipe(string(), trim(), maxLength(20))),
  description:  optional(pipe(string(), trim(), maxLength(500))),
  departmentId: optional(pipe(string(), uuid('ID département invalide'))),
  isOptional:   optional(boolean()),
  semester:     optional(pipe(number(), minValue(1), maxValue(8))),
  order:        optional(number()),
})

export type CreateUEInput  = InferInput<typeof createUESchema>
export type CreateUEOutput = InferOutput<typeof createUESchema>

export const linkUESchema = object({
  ueId:      pipe(string(), uuid('ID UE invalide')),
  programId: pipe(string(), uuid('ID programme invalide')),
  semester:  optional(pipe(number(), minValue(1), maxValue(8))),
  order:     optional(number()),
  description: optional(pipe(string(), trim(), maxLength(200))),
})
export type LinkUEInput = InferInput<typeof linkUESchema>

// Re-export from ue-course so callers can import from a single location
export type { CreateUECourseInput } from '@/services/ue-course/validation'

// Payload types for reordering (used by DB + actions)
export type UEOrder = {
  programUEId: string
  semester: number
  order: number
}

export type CourseOrder = {
  ueCourseId: string
  ueId: string
  order: number
}

export type ReorderProgramPayload = {
  programId: string
  ueOrders: UEOrder[]
  courseOrders: CourseOrder[]
}
