import { CACHE } from '@/cache/server/key'

export const SESSION_GRAPH = {
  SESSION_STARTED:   (orgId: string) => [CACHE.SESSION(orgId)],
  SESSION_COMPLETED: (orgId: string) => [CACHE.SESSION(orgId)],
} as const
