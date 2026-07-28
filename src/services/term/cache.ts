// src/services/term/cache.ts
// Terms sont des sous-entités de Class — les mutations invalident le cache CLASS.
import { CACHE } from '@/cache/server/key'

export const TERM_GRAPH = {
  TERM_GENERATED: (orgId: string, classId: string) => [CACHE.CLASS(orgId), CACHE.CLASS(orgId, classId)],
} as const
