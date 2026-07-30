import * as v from 'valibot'
import { VALID_EXPIRES_DAYS } from '../validation'

export const inviteParentSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email('Email invalide')),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  studentId: v.pipe(v.string(), v.trim(), v.minLength(1, 'Étudiant requis')),
  relation: v.pipe(v.string(), v.trim(), v.minLength(1, 'Lien requis'), v.maxLength(60, 'Lien trop long')),
  expiresInDays: v.optional(v.picklist(VALID_EXPIRES_DAYS, 'Durée invalide — valeurs : 1, 3, 7, 14, 30')),
})

export type InviteParentInput = v.InferInput<typeof inviteParentSchema>
