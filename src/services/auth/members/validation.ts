// src/services/auth/members/validation.ts
// Schéma de finalisation du signup via lien d'invitation.
// L'email est déjà connu (porté par le token Supabase) — seul le mot de passe
// est saisi par l'utilisateur.
import { object, string, pipe, minLength } from 'valibot'
import type { InferInput } from 'valibot'

export const memberSignupSchema = object({
  password:        pipe(string(), minLength(8, 'Minimum 8 caractères')),
  confirmPassword: pipe(string(), minLength(1, 'Confirmation requise')),
})

export type MemberSignupInput = InferInput<typeof memberSignupSchema>
