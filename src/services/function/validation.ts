import { object, pipe, string, trim, minLength, maxLength, optional, uuid, boolean } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createFunctionSchema = object({
  name:        pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100, 'Nom trop long')),
  description: optional(pipe(string(), trim(), maxLength(255))),
  icon:        optional(pipe(string(), trim())),
  isMain:      optional(boolean()),
})

export const updateFunctionSchema = object({
  functionId:  pipe(string(), uuid('ID invalide')),
  name:        optional(pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100))),
  description: optional(pipe(string(), trim(), maxLength(255))),
  icon:        optional(pipe(string(), trim())),
})

export type CreateFunctionInput  = InferInput<typeof createFunctionSchema>
export type CreateFunctionOutput = InferOutput<typeof createFunctionSchema>
export type UpdateFunctionInput  = InferInput<typeof updateFunctionSchema>
export type UpdateFunctionOutput = InferOutput<typeof updateFunctionSchema>
