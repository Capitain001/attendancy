// src/services/auth/validation.ts
// Schémas Valibot
import { object, string, pipe, email, minLength, trim } from "valibot";
import type { InferInput, InferOutput } from "valibot";

export const signupSchema = object({
  email: pipe(string(), trim(), email("Email invalide")),
  password: pipe(string(), minLength(8, "Minimum 8 caractères")),
  // info: optional(record(string(), unknown())),  // si beosin pustard de ce champs
});

export type SignupInput = InferInput<typeof signupSchema>;
export type SignupOutput = InferOutput<typeof signupSchema>;

// Le signup personnel ne choisit pas de rôle : le formulaire Web ne collecte
// que l'e-mail et le mot de passe, le profil sera complété ensuite.
export const signupPersonalSchema = object({
  email: pipe(string(), trim(), email("Email invalide")),
  password: pipe(string(), minLength(8, "Mot de passe trop court")),
});

export type SignupPersonalInput = InferInput<typeof signupPersonalSchema>;

export const loginSchema = object({
  email: pipe(string(), trim(), email("Email invalide")),
  password: pipe(string(), minLength(1, "Mot de passe requis")),
});

// InferInput  = ce que l'UI envoie (avant transformations — ex. trim)
// InferOutput = ce que le service reçoit après parse (après transformations)
export type LoginInput = InferInput<typeof loginSchema>;
export type LoginOutput = InferOutput<typeof loginSchema>;


export const resendSignupEmailSchema = object({
  email: pipe(
    string("Email manquant"),
    trim(),
    minLength(1, "Email manquant"),
    email("Email invalide")
  ),
});

export type ResendSignupEmailInput = InferInput<typeof resendSignupEmailSchema>;
export type ResendSignupEmailOutput = InferOutput<typeof resendSignupEmailSchema>;
