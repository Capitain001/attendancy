// src/services/department/cache.ts
import { CACHE } from '@/cache/server/key'

export const DEPARTMENT_GRAPH = {
  DEPARTMENT_CREATED: (orgId: string) => [CACHE.DEPARTMENT(orgId)],
  DEPARTMENT_UPDATED: (orgId: string) => [CACHE.DEPARTMENT(orgId)],
  DEPARTMENT_DELETED: (orgId: string) => [CACHE.DEPARTMENT(orgId)],
} as const
