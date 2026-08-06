import * as v from 'valibot'

export const ImportUETemplateSchema = v.object({
  templateId: v.pipe(v.string(), v.uuid('ID template invalide')),
  programId:  v.pipe(v.string(), v.uuid('ID programme invalide')),
  semester:   v.pipe(v.number(), v.minValue(1), v.maxValue(8)),
})

export type ImportUETemplateInput  = v.InferInput<typeof ImportUETemplateSchema>
export type ImportUETemplateOutput = v.InferOutput<typeof ImportUETemplateSchema>

// Import d'une filière complète (toutes les UEs d'une mention/spécialité)
export const ImportMentionSchema = v.object({
  referentialId: v.pipe(v.string(), v.uuid('ID référentiel invalide')),
  mention:       v.pipe(v.string(), v.minLength(1)),
  speciality:    v.optional(v.nullable(v.string())),
  programId:     v.pipe(v.string(), v.uuid('ID programme invalide')),
})

export type ImportMentionInput  = v.InferInput<typeof ImportMentionSchema>
export type ImportMentionOutput = v.InferOutput<typeof ImportMentionSchema>
