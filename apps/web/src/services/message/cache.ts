import { CACHE } from '@/cache/server/key';
//a coriger apres
export const MESSAGE_GRAPH = {
  MESSAGE_CREATED: (orgId: string, classId: string) => [
    CACHE.MESSAGE(orgId),
    CACHE.MESSAGE(orgId, classId),
    CACHE.MESSAGE(orgId, classId),
  ],
} as const
