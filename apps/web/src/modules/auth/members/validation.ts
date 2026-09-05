// src/services/auth/members/validation.ts
import { object, pipe, string, minLength, forward, partialCheck } from 'valibot'
import type { InferInput } from 'valibot'

export const signupMemberSchema = pipe(
  object({
    password: pipe(string(), minLength(8, 'Minimum 8 caractères')),
    confirmPassword: pipe(string(), minLength(1, 'Confirmation requise')),
  }),
  forward(
    partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'Les mots de passe ne correspondent pas'
    ),
    ['confirmPassword']
  )
)

export type SignupMemberInput = InferInput<typeof signupMemberSchema>
