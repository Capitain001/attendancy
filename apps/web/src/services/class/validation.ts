// src/services/class/validation.ts
import * as v from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateClassData, UpdateClassData } from './types'
import { LEVELS } from './constants'

export const createClassSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
  programTrackId: v.pipe(v.string(), v.uuid('ID filière invalide')),
  level: v.optional(v.picklist(LEVELS)),
  academicYearId: v.optional(v.pipe(v.string(), v.uuid('ID année invalide'))),
} satisfies Record<keyof CreateClassData, unknown>)

export type CreateClassInput = InferInput<typeof createClassSchema>
export type CreateClassOutput = InferOutput<typeof createClassSchema>

// Schéma du PAYLOAD seul (sans id) — toujours typé contre le modèle Prisma
// via `satisfies Record<keyof UpdateClassData, unknown>` : si un champ est
// ajouté/retiré sur Class, ce schéma casse à la compilation tant qu'il
// n'est pas mis à jour en conséquence.
export const updateClassDataSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100))),
  programTrackId: v.optional(v.pipe(v.string(), v.uuid('ID filière invalide'))),
  level: v.optional(v.picklist(LEVELS)),
  academicYearId: v.optional(v.pipe(v.string(), v.uuid('ID année invalide'))),
} satisfies Record<keyof UpdateClassData, unknown>)

export type UpdateClassDataInput = InferInput<typeof updateClassDataSchema>
export type UpdateClassDataOutput = InferOutput<typeof updateClassDataSchema>

// Schéma ENGLOBANT — id (validé UUID) + payload imbriqué sous `data`,
// factorisé via validateWithId (norme V2, cohérente avec `function`).
export const updateClassSchema = validateWithId('classId', updateClassDataSchema)

export type UpdateClassInput = InferInput<typeof updateClassSchema>
export type UpdateClassOutput = InferOutput<typeof updateClassSchema>
