// src/services/program-track/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, number, minValue, maxValue, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createProgramTrackSchema = object({
  name:         pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  description:  optional(pipe(string(), trim(), maxLength(500))),
  departmentId: pipe(string(), uuid('ID département invalide')),
})

export type CreateProgramTrackInput  = InferInput<typeof createProgramTrackSchema>
export type CreateProgramTrackOutput = InferOutput<typeof createProgramTrackSchema>

export const createProgramSchema = object({
  name:           pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  description:    optional(pipe(string(), trim(), maxLength(500))),
  programTrackId: pipe(string(), uuid('ID filière invalide')),
})

export type CreateProgramInput  = InferInput<typeof createProgramSchema>
export type CreateProgramOutput = InferOutput<typeof createProgramSchema>

export const addUEToProgramSchema = object({
  programId: pipe(string(), uuid('ID programme invalide')),
  ueId:      pipe(string(), uuid('ID UE invalide')),
  semester:  pipe(number(), minValue(1), maxValue(8)),
})

export type AddUEToProgramInput  = InferInput<typeof addUEToProgramSchema>
export type AddUEToProgramOutput = InferOutput<typeof addUEToProgramSchema>
