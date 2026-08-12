import * as v from 'valibot'

export const ApplyProgramsSchema = v.object({
  programTemplateIds: v.pipe(
    v.array(v.pipe(v.string(), v.uuid('ID invalide'))),
    v.minLength(1, 'Veuillez sélectionner au moins un programme')
  ),
})

export type ApplyProgramsInput = v.InferInput<typeof ApplyProgramsSchema>
export type ApplyProgramsOutput = v.InferOutput<typeof ApplyProgramsSchema>
