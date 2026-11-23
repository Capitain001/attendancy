// src/services/channel/cache.ts
import { CACHE } from '@/cache/server/key';

export const CHANNEL_GRAPH = {
  CHANNEL_CREATED: (orgId: string) => [CACHE.CHANNEL(orgId)],
  CHANNEL_UPDATED: (orgId: string, channelId: string) => [
    CACHE.CHANNEL(orgId),
    CACHE.CHANNEL(orgId, channelId),
  ],
  CHANNEL_REMOVED: (orgId: string, channelId: string) => [
    CACHE.CHANNEL(orgId),
    CACHE.CHANNEL(orgId, channelId),
  ],
} as const;
