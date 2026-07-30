import { CACHE } from '@/cache/server/key'

export const DIRECTION_GRAPH = {
  DIRECTION_UPDATED: (orgId: string) => [CACHE.DIRECTION(orgId)],
  DIRECTION_REMOVED: (orgId: string) => [CACHE.DIRECTION(orgId)],
} as const
