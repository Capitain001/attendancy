import { CACHE } from '@/cache/server/key'

export const FUNCTION_GRAPH = {
  FUNCTION_CREATED: (orgId: string) => [CACHE.FUNCTION(orgId)],
  FUNCTION_UPDATED: (orgId: string) => [CACHE.FUNCTION(orgId)],
  FUNCTION_DELETED: (orgId: string) => [CACHE.FUNCTION(orgId)],
  FUNCTION_ASSIGNED: (orgId: string) => [CACHE.FUNCTION(orgId)],
  FUNCTION_UNASSIGNED: (orgId: string) => [CACHE.FUNCTION(orgId)],
} as const
