// src/services/invite/validation.ts
import { object, string, pipe, email, picklist, optional, trim, minLength, number } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const INVITABLE_ROLES = ['TEACHER', 'STUDENT', 'PARENT'] as const
export type InvitableRole = (typeof INVITABLE_ROLES)[number]

export const VALID_EXPIRES_DAYS = [1, 3, 7, 14, 30] as const

export const sendInviteSchema = object({
  email: pipe(string(), trim(), email('Email invalide')),
  role: picklist(INVITABLE_ROLES, 'Rôle invalide'),
  expiresInDays: optional(picklist(VALID_EXPIRES_DAYS, 'Durée invalide — valeurs : 1, 3, 7, 14, 30')),
})

export const acceptInviteSchema = object({
  token: pipe(string(), trim(), minLength(1, 'Token requis')),
  firstName: optional(pipe(string(), trim())),
  lastName: optional(pipe(string(), trim())),
})

export type SendInviteInput  = InferInput<typeof sendInviteSchema>
export type SendInviteOutput = InferOutput<typeof sendInviteSchema>
export type AcceptInviteInput  = InferInput<typeof acceptInviteSchema>
export type AcceptInviteOutput = InferOutput<typeof acceptInviteSchema>
