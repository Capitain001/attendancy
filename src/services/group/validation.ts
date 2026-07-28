// src/services/group/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createGroupSchema = object({
  name:        pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  description: optional(pipe(string(), trim(), maxLength(500))),
  classId:     pipe(string(), uuid('ID classe invalide')),
})

export type CreateGroupInput  = InferInput<typeof createGroupSchema>
export type CreateGroupOutput = InferOutput<typeof createGroupSchema>
