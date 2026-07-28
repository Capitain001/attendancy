// src/services/invite/validation.ts
import { object, string, pipe, email, picklist, optional, trim, minLength } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const INVITABLE_ROLES = ['TEACHER', 'STUDENT', 'PARENT'] as const
export type InvitableRole = (typeof INVITABLE_ROLES)[number]

export const sendInviteSchema = object({
  email: pipe(string(), trim(), email('Email invalide')),
  role: picklist(INVITABLE_ROLES, 'Rôle invalide'),
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
