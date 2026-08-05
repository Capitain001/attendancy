import { object, string, pipe, uuid } from 'valibot'
import type { InferInput } from 'valibot'

export const createSubscriptionSchema = object({
  planId: pipe(string(), uuid('Référence plan invalide')),
})

export type CreateSubscriptionInput = InferInput<typeof createSubscriptionSchema>
