// src/services/academic-year/cache.ts
// Graphe d'invalidation : événement → tags à invalider.
// Enregistré dans src/cache/server/key.ts (spread dans CACHE_GRAPH).
import { CACHE } from '@/cache/server/key'

export const ACADEMIC_YEAR_GRAPH = {
  ACADEMIC_YEAR_CREATED: (orgId: string) => [CACHE.ACADEMIC_YEAR(orgId)],
  ACADEMIC_YEAR_UPDATED: (orgId: string) => [CACHE.ACADEMIC_YEAR(orgId)],
  ACADEMIC_YEAR_REMOVED: (orgId: string) => [CACHE.ACADEMIC_YEAR(orgId)],
} as const
