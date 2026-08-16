// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts organization
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createOrgWithDefaults, updateOrganization, setOrgDetails, updateOrgLogo, setMemberStatusWithAudit, getOrgIdentity, getOrgUsage, getOrgDetails, getOrgDailyMetrics, getOrgBySlug, getOrgResourcesCounts, getOrganizationBySlug } from './database'

export type CreateOrgWithDefaultsDto = Awaited<ReturnType<typeof createOrgWithDefaults>>
export type UpdateOrganizationDto = Awaited<ReturnType<typeof updateOrganization>>
export type SetOrgDetailsDto = Awaited<ReturnType<typeof setOrgDetails>>
export type UpdateOrgLogoDto = Awaited<ReturnType<typeof updateOrgLogo>>
export type SetMemberStatusWithAuditDto = Awaited<ReturnType<typeof setMemberStatusWithAudit>>
export type GetOrgIdentityDto = Awaited<ReturnType<typeof getOrgIdentity>>
export type GetOrgUsageDto = Awaited<ReturnType<typeof getOrgUsage>>
export type GetOrgDetailsDto = Awaited<ReturnType<typeof getOrgDetails>>
export type GetOrgDailyMetricsDto = Awaited<ReturnType<typeof getOrgDailyMetrics>>
export type GetOrgBySlugDto = Awaited<ReturnType<typeof getOrgBySlug>>
export type GetOrgResourcesCountsDto = Awaited<ReturnType<typeof getOrgResourcesCounts>>
export type GetOrganizationBySlugDto = Awaited<ReturnType<typeof getOrganizationBySlug>>
