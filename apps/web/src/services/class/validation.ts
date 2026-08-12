// src/services/class/validation.ts
import * as v from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import type { CreateClassData, UpdateClassData } from './types'
import { LEVELS } from './constants'

export type CreateClassDataValidation = Omit<CreateClassData, 'academicYearId' | 'level'> & {
  level?: CreateClassData['level']
  academicYearId?: string
}

export const createClassSchema: v.GenericSchema<CreateClassDataValidation, CreateClassDataValidation> = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
  programTrackId: v.pipe(v.string(), v.uuid('ID filière invalide')),
  level: v.optional(v.picklist(LEVELS)),
  academicYearId: v.optional(v.pipe(v.string(), v.uuid('ID année invalide'))),
})

export type CreateClassInput = InferInput<typeof createClassSchema>
export type CreateClassOutput = InferOutput<typeof createClassSchema>

export type UpdateClassDataValidation = Partial<Omit<UpdateClassData, 'level'>> & {
  level?: CreateClassData['level']
}

export const updateClassSchema: v.GenericSchema<UpdateClassDataValidation, UpdateClassDataValidation> = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100))),
  programTrackId: v.optional(v.pipe(v.string(), v.uuid('ID filière invalide'))),
  level: v.optional(v.picklist(LEVELS)),
  academicYearId: v.optional(v.pipe(v.string(), v.uuid('ID année invalide'))),
})

export type UpdateClassInput = InferInput<typeof updateClassSchema>
export type UpdateClassOutput = InferOutput<typeof updateClassSchema>