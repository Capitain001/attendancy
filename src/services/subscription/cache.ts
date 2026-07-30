import { CACHE } from '@/cache/server/key'

export const SUBSCRIPTION_GRAPH = {
  SUBSCRIPTION_CREATED: (orgId: string) => [CACHE.SUBSCRIPTION(orgId)],
  SUBSCRIPTION_UPDATED: (orgId: string) => [CACHE.SUBSCRIPTION(orgId)],
  PLAN_UPDATED: () => [CACHE.PLAN()],
} as const
