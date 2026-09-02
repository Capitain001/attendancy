// src/services/term/validation.ts
import * as v from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateTermData, UpdateTermData } from './types'

// Un semestre borné doit avoir startDate < endDate quand les deux sont
// fournis — même invariant que Schedule.check_schedule_time_order, mais
// applicatif ici (Term.startDate/endDate sont nullable, générées sans dates
// puis bornées ensuite par la direction).
// Générique impérative : un paramètre typé en dur `{ startDate?; endDate? }`
// fait inférer à v.check() un CheckAction restreint à CE sous-type, incompatible
// avec le schéma complet (classId/order/name inclus) attendu par v.pipe.
function hasValidDateOrder<T extends { startDate?: Date | null; endDate?: Date | null }>(
  input: T,
) {
  return !input.startDate || !input.endDate || input.startDate < input.endDate
}

const createTermShape = {
  classId: v.pipe(v.string(), v.uuid('ID de classe invalide')),
  order: v.pipe(v.number(), v.integer('Doit être un entier'), v.minValue(1, 'Doit être ≥ 1')),
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
  startDate: v.optional(v.nullable(v.date())),
  endDate: v.optional(v.nullable(v.date())),
} satisfies Record<keyof CreateTermData, unknown>

export const createTermSchema = v.pipe(
  v.object(createTermShape),
  v.check(hasValidDateOrder, 'La date de début doit précéder la date de fin')
)

export type CreateTermInput = v.InferInput<typeof createTermSchema>
export type CreateTermOutput = v.InferOutput<typeof createTermSchema>

// ─── Update — validateWithId (norme V2) ──────────────────────────────────────

export const updateTermDataSchema = v.pipe(
  v.object({
    order: v.optional(v.pipe(v.number(), v.integer('Doit être un entier'), v.minValue(1, 'Doit être ≥ 1'))),
    name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100))),
    startDate: v.optional(v.nullable(v.date())),
    endDate: v.optional(v.nullable(v.date())),
  } satisfies Record<keyof UpdateTermData, unknown>),
  v.check(hasValidDateOrder, 'La date de début doit précéder la date de fin')
)

export type UpdateTermDataInput = v.InferInput<typeof updateTermDataSchema>
export type UpdateTermDataOutput = v.InferOutput<typeof updateTermDataSchema>

export const updateTermSchema = validateWithId('termId', updateTermDataSchema)

export type UpdateTermInput = v.InferInput<typeof updateTermSchema> // { termId: string; data: UpdateTermDataInput }
export type UpdateTermOutput = v.InferOutput<typeof updateTermSchema> // { termId: string; data: UpdateTermDataOutput }

// ─── Remove / génération — id seul ───────────────────────────────────────────

export const termIdSchema = v.pipe(v.string(), v.uuid('ID de semestre invalide'))
export const classIdSchema = v.pipe(v.string(), v.uuid('ID de classe invalide'))