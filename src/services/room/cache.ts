// src/services/room/cache.ts
import { CACHE } from '@/cache/server/key'

export const ROOM_GRAPH = {
  ROOM_CREATED: (orgId: string) => [CACHE.ROOM(orgId)],
  ROOM_UPDATED: (orgId: string) => [CACHE.ROOM(orgId)],
  ROOM_DELETED: (orgId: string) => [CACHE.ROOM(orgId)],
} as const
