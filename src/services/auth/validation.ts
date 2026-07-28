// src/services/auth/validation.ts
// Schémas Valibot — toujours Valibot, jamais Zod.
import { object, string, pipe, email, minLength, trim } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const signupSchema = object({
  email: pipe(string(), trim(), email('Email invalide')),
  password: pipe(string(), minLength(8, 'Minimum 8 caractères')),
})

export const loginSchema = object({
  email: pipe(string(), trim(), email('Email invalide')),
  password: pipe(string(), minLength(1, 'Mot de passe requis')),
})

// InferInput  = ce que l'UI envoie (avant transformations — ex. trim)
// InferOutput = ce que le service reçoit après parse (après transformations)
export type SignupInput  = InferInput<typeof signupSchema>
export type SignupOutput = InferOutput<typeof signupSchema>
export type LoginInput   = InferInput<typeof loginSchema>
export type LoginOutput  = InferOutput<typeof loginSchema>
