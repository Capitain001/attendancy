//validation
import { object, pipe, string, trim, minLength, maxLength, optional, boolean } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateFunctionData, UpdateFunctionData } from './types'

export const createFunctionSchema = object({
  name:        pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100, 'Nom trop long')),
  description: optional(pipe(string(), trim(), maxLength(255))),
  icon:        optional(pipe(string(), trim())),
  isMain:      optional(boolean()),
} satisfies Record<keyof CreateFunctionData, unknown>)

export const updateFunctionDataSchema = object({
  name:        optional(pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100))),
  description: optional(pipe(string(), trim(), maxLength(255))),
  icon:        optional(pipe(string(), trim())),
  isMain:      optional(boolean()),
} satisfies Record<keyof UpdateFunctionData, unknown>)

export const updateFunctionSchema = validateWithId('functionId', updateFunctionDataSchema)

export type CreateFunctionInput  = InferInput<typeof createFunctionSchema>
export type CreateFunctionOutput = InferOutput<typeof createFunctionSchema>

export type UpdateFunctionDataInput = InferInput<typeof updateFunctionDataSchema>
export type UpdateFunctionDataOutput = InferOutput<typeof updateFunctionDataSchema>

export type UpdateFunctionInput  = InferInput<typeof updateFunctionSchema>
export type UpdateFunctionOutput = InferOutput<typeof updateFunctionSchema>



import * as v from 'valibot'

// Pas de pattern existant pour les ids en lecture seule — validation minimale
// mais alignée sur la convention `validation.ts` : IDs = uuid, InferInput/Output exportés.
export const getUserFunctionsSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('ID utilisateur invalide')),
})

export type GetUserFunctionsInput = v.InferInput<typeof getUserFunctionsSchema>
export type GetUserFunctionsOutput = v.InferOutput<typeof getUserFunctionsSchema>


export const getFunctionDetailSchema = v.object({
  functionId: v.pipe(v.string(), v.uuid('ID invalide')),
})
export type GetFunctionDetailInput = v.InferInput<typeof getFunctionDetailSchema>

export const revokeFunctionFromUserSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('ID invalide')),
  functionId: v.pipe(v.string(), v.uuid('ID invalide')),
})
export type RevokeFunctionFromUserInput = v.InferInput<typeof revokeFunctionFromUserSchema>