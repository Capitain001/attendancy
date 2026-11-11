// src/services/session/validation.ts
// src/services/session/validation.ts (ajout)
import * as v from 'valibot'

export const getTeacherPastSessionsSchema = v.object({
  teacherId: v.pipe(v.string(), v.uuid('ID invalide')),
  page: v.pipe(v.number(), v.integer(), v.minValue(1, 'Page invalide')),
})

export type GetTeacherPastSessionsInput = v.InferInput<typeof getTeacherPastSessionsSchema>
export type GetTeacherPastSessionsOutput = v.InferOutput<typeof getTeacherPastSessionsSchema>