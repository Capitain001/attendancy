import * as v from 'valibot'
import type { CreatePersonalCourseData } from './types'

export const createPersonalCourseSchema = v.object({
  classId: v.pipe(v.string(), v.uuid('ID invalide')),
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
  teacherId: v.pipe(v.string(), v.uuid('ID invalide')),
  // Décision de l'appelant : créer aussi un groupe lié au cours (ex. classe THEMATIC).
  withGroup: v.optional(v.boolean()),
} satisfies Record<keyof CreatePersonalCourseData, unknown>)

export type CreatePersonalCourseInput  = v.InferInput<typeof createPersonalCourseSchema>
export type CreatePersonalCourseOutput = v.InferOutput<typeof createPersonalCourseSchema>
