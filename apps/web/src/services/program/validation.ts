// src/services/program/validation.ts
import * as v from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateProgramData, UpdateProgramData } from './types'

export const CreateProgramSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Le nom est requis'), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500))),
  programTrackId: v.pipe(v.string(), v.uuid('Identifiant de parcours invalide')),
  classId: v.optional(v.pipe(v.string(), v.uuid('Identifiant de classe invalide'))),
} satisfies Record<keyof CreateProgramData, unknown>)

export const UpdateProgramDataSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100))),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500))),
  programTrackId: v.optional(v.pipe(v.string(), v.uuid('Identifiant de parcours invalide'))),
  classId: v.optional(v.pipe(v.string(), v.uuid('Identifiant de classe invalide'))),
} satisfies Record<keyof UpdateProgramData, unknown>)

export const UpdateProgramSchema = validateWithId('programId', UpdateProgramDataSchema)

export type CreateProgramInput = v.InferInput<typeof CreateProgramSchema>
export type CreateProgramOutput = v.InferOutput<typeof CreateProgramSchema>

export type UpdateProgramDataInput = v.InferInput<typeof UpdateProgramDataSchema>
export type UpdateProgramDataOutput = v.InferOutput<typeof UpdateProgramDataSchema>

export type UpdateProgramInput = v.InferInput<typeof UpdateProgramSchema>
export type UpdateProgramOutput = v.InferOutput<typeof UpdateProgramSchema>
