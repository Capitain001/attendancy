import * as v from 'valibot'
import { VALID_EXPIRES_DAYS } from '../validation'

export const inviteDirectionSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email('Email invalide')),
  name: v.optional(v.string()),
  functions: v.pipe(
    v.array(v.pipe(v.string(), v.trim(), v.minLength(1))),
    v.minLength(1, 'Au moins une fonction est requise')
  ),
  expiresInDays: v.optional(v.picklist(VALID_EXPIRES_DAYS, 'Durée invalide — valeurs : 1, 3, 7, 14, 30')),
})

export type InviteDirectionInput = v.InferInput<typeof inviteDirectionSchema>
