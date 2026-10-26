import * as v from 'valibot'
import { ClassType } from '@/generated/prisma/client'
import { validateWithId } from '@/utils/server/validation'
import { PERSONAL } from '@/features/personal/constants'
import type { CreatePersonalClassData, UpdatePersonalClassData } from './types'

const personalClassName = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Nom requis'),
  v.maxLength(100),
  v.check((name) => name.toLowerCase() !== PERSONAL.NAME.toLowerCase(), 'Ce nom est réservé'),
)

export const createPersonalClassSchema = v.object({
  name: personalClassName,
  type: v.optional(v.enum(ClassType)),
} satisfies Record<keyof CreatePersonalClassData, unknown>)

export type CreatePersonalClassInput = v.InferInput<typeof createPersonalClassSchema>
export type CreatePersonalClassOutput = v.InferOutput<typeof createPersonalClassSchema>

export const updatePersonalClassDataSchema = v.object({
  name: v.optional(personalClassName),
  type: v.optional(v.enum(ClassType)),
} satisfies Record<keyof UpdatePersonalClassData, unknown>)

export type UpdatePersonalClassDataInput = v.InferInput<typeof updatePersonalClassDataSchema>
export type UpdatePersonalClassDataOutput = v.InferOutput<typeof updatePersonalClassDataSchema>

export const updatePersonalClassSchema = validateWithId('classId', updatePersonalClassDataSchema)

export type UpdatePersonalClassInput = v.InferInput<typeof updatePersonalClassSchema>
export type UpdatePersonalClassOutput = v.InferOutput<typeof updatePersonalClassSchema>