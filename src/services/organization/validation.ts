// src/services/org/validation.ts
import {
  object,
  string,
  pipe,
  trim,
  minLength,
  maxLength,
  regex,
  optional,
  email,
  toLowerCase,
} from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

// Setup initial d'une org par le fondateur (DIRECTION).
// slug = segment d'URL du tenant : minuscules, chiffres, tirets.
export const orgSetupSchema = object({
  name: pipe(string(), trim(), minLength(2, 'Nom trop court'), maxLength(100)),
  slug: pipe(
    string(),
    trim(),
    toLowerCase(),
    minLength(2, 'Slug trop court'),
    maxLength(50),
    regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets)')
  ),
  email: optional(pipe(string(), trim(), email('Email invalide'))),
})

export type OrgSetupInput = InferInput<typeof orgSetupSchema>
export type OrgSetupOutput = InferOutput<typeof orgSetupSchema>

// Édition identité par DIRECTION/PRINCIPAL (name, email, domain, logo uniquement).
export const updateOrgIdentitySchema = object({
  name: optional(pipe(string(), trim(), minLength(2), maxLength(120))),
  email: optional(pipe(string(), trim(), email('Email invalide'))),
  domain: optional(pipe(string(), trim(), maxLength(255))),
  logo: optional(string()),
})

export type UpdateOrgIdentityInput = InferInput<typeof updateOrgIdentitySchema>
export type UpdateOrgIdentityOutput = InferOutput<typeof updateOrgIdentitySchema>

// Alias rétrocompatibilité — à utiliser dans les nouveaux fichiers.
export const createOrgSchema = orgSetupSchema
export const createOrganizationSchema = orgSetupSchema
export const updateOrgSchema = updateOrgIdentitySchema
export type CreateOrgInput = OrgSetupInput
export type UpdateOrgInput = UpdateOrgIdentityInput
