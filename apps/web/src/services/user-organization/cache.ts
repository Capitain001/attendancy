import { CACHE } from "@/cache/server/key";

export const USER_ORGANIZATION_GRAPH = {
    USER_ORGANIZATION_STATUS_CHANGED: (orgId: string, userId: string) => [
    CACHE.USER_ORGANIZATION(orgId),
    CACHE.USER_ORGANIZATION(orgId, userId),
  ],
} as const;
