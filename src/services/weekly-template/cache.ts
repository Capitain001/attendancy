import { CACHE } from '@/cache/server/key'

export const WEEKLY_TEMPLATE_GRAPH = {
  WEEKLY_TEMPLATE_CREATED: (orgId: string) => [CACHE.WEEKLY_TEMPLATE(orgId)],
  WEEKLY_TEMPLATE_UPDATED: (orgId: string) => [CACHE.WEEKLY_TEMPLATE(orgId)],
  WEEKLY_TEMPLATE_REMOVED: (orgId: string) => [CACHE.WEEKLY_TEMPLATE(orgId)],
} as const
