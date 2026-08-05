import * as v from 'valibot'

export const assignFunctionsSchema = v.object({
  userId:        v.pipe(v.string(), v.nonEmpty("L'utilisateur est requis")),
  functionNames: v.array(
    v.pipe(v.string(), v.nonEmpty('Nom de fonction requis')),
    'Au moins une fonction est requise'
  ),
})

export const revokeFunctionsSchema = v.object({
  userId:      v.pipe(v.string(), v.nonEmpty("L'utilisateur est requis")),
  functionIds: v.array(
    v.pipe(v.string(), v.nonEmpty('ID de fonction requis')),
    'Au moins une fonction est requise'
  ),
})

export const directionIdSchema = v.object({
  directionId: v.pipe(v.string(), v.nonEmpty('ID requis')),
})

export type AssignFunctionsInput  = v.InferInput<typeof assignFunctionsSchema>
export type RevokeFunctionsInput  = v.InferInput<typeof revokeFunctionsSchema>
