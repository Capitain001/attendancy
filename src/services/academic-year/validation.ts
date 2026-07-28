// src/services/academic-year/validation.ts
import { object, pipe, string, trim, minLength, maxLength, isoDate, transform, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createAcademicYearSchema = object({
  name: pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  startDate: pipe(string(), isoDate('Date de début invalide'), transform((s) => new Date(s))),
  endDate: pipe(string(), isoDate('Date de fin invalide'), transform((s) => new Date(s))),
})

export type CreateAcademicYearInput  = InferInput<typeof createAcademicYearSchema>
export type CreateAcademicYearOutput = InferOutput<typeof createAcademicYearSchema>

export const setCurrentYearSchema = object({
  academicYearId: pipe(string(), uuid('ID invalide')),
})

export type SetCurrentYearInput  = InferInput<typeof setCurrentYearSchema>
export type SetCurrentYearOutput = InferOutput<typeof setCurrentYearSchema>
