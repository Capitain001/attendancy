import { CACHE } from "@/cache/server/key";

export const EVALUATION_GRAPH = {
  EVALUATION_CREATED: (orgId: string) => [CACHE.EVALUATION(orgId)],
  EVALUATION_UPDATED: (orgId: string, evaluationId: string) => [
    CACHE.EVALUATION(orgId),
    CACHE.EVALUATION(orgId, evaluationId),
  ],
  EVALUATION_DELETED: (orgId: string, evaluationId: string) => [
    CACHE.EVALUATION(orgId),
    CACHE.EVALUATION(orgId, evaluationId),
  ],
} as const;
