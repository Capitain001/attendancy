// src/services/ue/cache.ts
import { CACHE } from '@/cache/server/key'

export const UE_GRAPH = {
  UE_CREATED:  (orgId: string) => [CACHE.UE(orgId)],
  UE_ARCHIVED: (orgId: string, ueId: string) => [CACHE.UE(orgId), CACHE.UE(orgId, ueId)],
} as const
