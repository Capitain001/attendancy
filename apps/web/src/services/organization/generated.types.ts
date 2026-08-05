// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts organization
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getOrgIdentity, getOrgUsage, getOrgDetails, getOrgDailyMetrics, getOrgBySlug, getOrgResourcesCounts, getOrganizationBySlug } from './database'

export type GetOrgIdentityDto = Awaited<ReturnType<typeof getOrgIdentity>>
export type GetOrgUsageDto = Awaited<ReturnType<typeof getOrgUsage>>
export type GetOrgDetailsDto = Awaited<ReturnType<typeof getOrgDetails>>
export type GetOrgDailyMetricsDto = Awaited<ReturnType<typeof getOrgDailyMetrics>>
export type GetOrgBySlugDto = Awaited<ReturnType<typeof getOrgBySlug>>
export type GetOrgResourcesCountsDto = Awaited<ReturnType<typeof getOrgResourcesCounts>>
export type GetOrganizationBySlugDto = Awaited<ReturnType<typeof getOrganizationBySlug>>
