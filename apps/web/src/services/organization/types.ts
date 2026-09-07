// src/services/org/types.ts
// DTOs inférés depuis les fonctions database/ — pattern Awaited<ReturnType>.
// Régénérable via : npx tsx scripts/generate/types/types.ts org

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
export * from './generated.types'
