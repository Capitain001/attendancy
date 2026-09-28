// src/services/org/validation.ts
import * as v from 'valibot'
import { isReservedSlug } from '@/lib/slug'
import type { CreateOrgData, UpdateOrgIdentityData } from './types'

// Setup initial d'une org INSTITUTIONNELLE par le fondateur (DIRECTION).
// slug = segment d'URL du tenant : minuscules, chiffres, tirets.
// Le formulaire permet l'édition manuelle du slug : les slugs réservés (segments
// de routes, préfixes de types d'org générés) sont donc refusés ici, côté serveur.
export const orgSetupSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(2, 'Nom trop court'), v.maxLength(100)),
  slug: v.pipe(
    v.string(),
    v.trim(),
    v.toLowerCase(),
    v.minLength(2, 'Slug trop court'),
    v.maxLength(50),
    v.regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets)'),
    v.check((slug) => !isReservedSlug(slug), 'Identifiant réservé'),
  ),
  email: v.optional(v.pipe(v.string(), v.trim(), v.email('Email invalide'))),
} satisfies Record<keyof CreateOrgData, unknown>)

export type OrgSetupInput = v.InferInput<typeof orgSetupSchema>
export type OrgSetupOutput = v.InferOutput<typeof orgSetupSchema>

// Édition identité par DIRECTION/PRINCIPAL (name, email, domain, logo uniquement).
// Pas de validateWithId : l'id de l'org vient du token (orgId), jamais de l'input.
export const updateOrgIdentitySchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(120))),
  email: v.optional(v.pipe(v.string(), v.trim(), v.email('Email invalide'))),
  domain: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(255))),
  logo: v.optional(v.string()),
} satisfies Record<keyof UpdateOrgIdentityData, unknown>)

export type UpdateOrgIdentityInput = v.InferInput<typeof updateOrgIdentitySchema>
export type UpdateOrgIdentityOutput = v.InferOutput<typeof updateOrgIdentitySchema>