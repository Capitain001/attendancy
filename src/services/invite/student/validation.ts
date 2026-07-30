import * as v from 'valibot'
import { VALID_EXPIRES_DAYS } from '../validation'

export const inviteStudentSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email('Email invalide')),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  classId: v.pipe(v.string(), v.trim(), v.minLength(1, "L'ID de la classe est requis")),
  groupIds: v.optional(v.array(v.pipe(v.string(), v.minLength(1, 'ID de groupe invalide')))),
  parentEmail: v.optional(v.pipe(v.string(), v.trim(), v.email('Email parent invalide'))),
  expiresInDays: v.optional(v.picklist(VALID_EXPIRES_DAYS, 'Durée invalide — valeurs : 1, 3, 7, 14, 30')),
})

export type InviteStudentInput = v.InferInput<typeof inviteStudentSchema>
