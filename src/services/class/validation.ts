// src/services/class/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, picklist, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'] as const

export const createClassSchema = object({
  name:           pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  programTrackId: pipe(string(), uuid('ID filière invalide')),
  level:          optional(picklist(LEVELS)),
  academicYearId: optional(pipe(string(), uuid('ID année invalide'))),
})

export type CreateClassInput  = InferInput<typeof createClassSchema>
export type CreateClassOutput = InferOutput<typeof createClassSchema>

export { LEVELS }
