import { CACHE } from '@/cache/server/key'

export const PERMISSION_GRAPH = {
  PERMISSION_GRANTED: (orgId: string, scopeId?: string) => [
    CACHE.PERMISSION(orgId),
    ...(scopeId ? [CACHE.PERMISSION(orgId, scopeId)] : []),
  ],
  PERMISSION_REVOKED: (orgId: string, scopeId?: string) => [
    CACHE.PERMISSION(orgId),
    ...(scopeId ? [CACHE.PERMISSION(orgId, scopeId)] : []),
  ],
}