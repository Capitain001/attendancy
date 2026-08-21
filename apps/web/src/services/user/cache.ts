import { CACHE } from "@/cache/server/key";

export const USER_GRAPH = {
  USER_CREATED: (orgId: string) => [CACHE.USER(orgId)],
  USER_UPDATED: (orgId: string, userId: string) => [
    CACHE.USER(orgId),
    CACHE.USER(orgId, userId),
  ],
  USER_DELETED: (orgId: string, userId: string) => [
    CACHE.USER(orgId),
    CACHE.USER(orgId, userId),
  ],
} as const;
