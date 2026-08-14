// src/services/academic-year/validation.ts
import { object, pipe, string, trim, minLength, maxLength, isoDate, transform, uuid, optional } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateAcademicYearData, UpdateAcademicYearData } from './types'

export const createAcademicYearSchema = object({
  name: pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  startDate: pipe(string(), isoDate('Date de début invalide'), transform((s) => new Date(s))),
  endDate: pipe(string(), isoDate('Date de fin invalide'), transform((s) => new Date(s))),
} satisfies Record<keyof CreateAcademicYearData, unknown>)

export type CreateAcademicYearInput  = InferInput<typeof createAcademicYearSchema>
export type CreateAcademicYearOutput = InferOutput<typeof createAcademicYearSchema>

export const setCurrentYearSchema = object({
  academicYearId: pipe(string(), uuid('ID invalide')),
})

export type SetCurrentYearInput  = InferInput<typeof setCurrentYearSchema>
export type SetCurrentYearOutput = InferOutput<typeof setCurrentYearSchema>

export const updateAcademicYearDataSchema = object({
  name: optional(pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100))),
  startDate: optional(pipe(string(), isoDate('Date de début invalide'), transform((s) => new Date(s)))),
  endDate: optional(pipe(string(), isoDate('Date de fin invalide'), transform((s) => new Date(s)))),
} satisfies Record<keyof UpdateAcademicYearData, unknown>)

export type UpdateAcademicYearDataInput = InferInput<typeof updateAcademicYearDataSchema>
export type UpdateAcademicYearDataOutput = InferOutput<typeof updateAcademicYearDataSchema>

export const updateAcademicYearSchema = validateWithId('academicYearId', updateAcademicYearDataSchema)

export type UpdateAcademicYearInput = InferInput<typeof updateAcademicYearSchema>
export type UpdateAcademicYearOutput = InferOutput<typeof updateAcademicYearSchema>
