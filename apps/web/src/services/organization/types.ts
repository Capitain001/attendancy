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


// Setup d'une org INSTITUTIONNELLE par le fondateur — typent orgSetupSchema (validation.ts).
export type CreateOrgData = Pick<
  Prisma.OrganizationUncheckedCreateInput,
  'name' | 'slug' | 'email'
>
 

export type UpdateOrgIdentityData = Partial<
  Pick<Prisma.OrganizationUncheckedCreateInput, 'name' | 'email' | 'domain' | 'logo'>
>
 
