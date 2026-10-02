// src/services/organization/types.ts
// src/services/org/types.ts
export * from './generated.types'
import type { Prisma } from '@/generated/prisma/client'

// Champ JSON `Organization.details` — ⚠ à étendre selon les besoins du projet.
export type OrgContactSite = {
  ville: string
  'adresse-postale'?: string
  indicatif?: string
  phones?: string[]
  emails?: string[]
}

export type OrgDetails = {
  contact?: OrgContactSite[]
  [key: string]: unknown
}

export type CreateOrgResult = { data: { slug: string } } | { error: string }


// userId n'y figure pas : il vient de l'auth token (createOrgAction), jamais
// de l'input utilisateur — seuls les champs réellement saisis sont validés.
export type CreateOrgData = Pick<
  Prisma.OrganizationUncheckedCreateInput,
  'name' | 'slug' | 'email'
>
 
export type UpdateOrgIdentityData = Partial<
  Pick<Prisma.OrganizationUncheckedCreateInput, 'name' | 'email' | 'domain' | 'logo'>
>
 
