// src/services/event/cache.ts
import { CACHE } from '@/cache/server/key'

export const EVENT_GRAPH = {
  EVENT_CREATED: (orgId: string) => [
    CACHE.EVENT(orgId),
  ],
  EVENT_UPDATED: (orgId: string, eventId: string) => [
    CACHE.EVENT(orgId),
    CACHE.EVENT(orgId, eventId),
  ],
  EVENT_REMOVED: (orgId: string, eventId: string) => [
    CACHE.EVENT(orgId),
    CACHE.EVENT(orgId, eventId),
  ],
} as const
