// src/services/class/validation.ts
import * as v from 'valibot'
import { CreatePersonalClassData } from '../class'
import { PERSONAL } from './constants'

export const createPersonalClassSchema = v.object({
  // name absent -> PERSONAL.NAME
  name: v.optional(
    v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
    PERSONAL.NAME,
  ),
} satisfies Record<keyof CreatePersonalClassData, unknown>)
 
export type CreatePersonalClassInput = v.InferInput<typeof createPersonalClassSchema>   // { name?: string }
export type CreatePersonalClassOutput = v.InferOutput<typeof createPersonalClassSchema> // { name: string }
