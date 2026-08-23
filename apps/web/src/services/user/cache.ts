import { CACHE } from "@/cache/server/key";
/* pas besoin de cache pr le profile user curent le graph sera decommenter pr les nouvele fn */
// export const USER_GRAPH = {
//   USER_CREATED: (orgId: string) => [CACHE.USER(orgId)],
//   USER_UPDATED: (orgId: string, userId: string) => [
//     CACHE.USER(orgId),
//     CACHE.USER(orgId, userId),
//   ],
//   USER_DELETED: (orgId: string, userId: string) => [
//     CACHE.USER(orgId),
//     CACHE.USER(orgId, userId),
//   ],
// } as const;
