// src/services/program/validation.ts
import * as v from 'valibot'

export const CreateProgramSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Le nom est requis'), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500))),
  programTrackId: v.pipe(v.string(), v.uuid('Identifiant de parcours invalide')),
  classId: v.optional(v.pipe(v.string(), v.uuid('Identifiant de classe invalide'))),
})

export const UpdateProgramSchema = v.partial(
  v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
    description: v.pipe(v.string(), v.trim(), v.maxLength(500)),
    programTrackId: v.pipe(v.string(), v.uuid('Identifiant de parcours invalide')),
    classId: v.optional(v.pipe(v.string(), v.uuid('Identifiant de classe invalide'))),
  })
)
export type CreateProgramInput = v.InferInput<typeof CreateProgramSchema>
export type CreateProgramOutput = v.InferOutput<typeof CreateProgramSchema>

export type UpdateProgramInput = v.InferInput<typeof UpdateProgramSchema>
export type UpdateProgramOutput = v.InferOutput<typeof UpdateProgramSchema>