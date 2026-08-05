// src/services/program/cache.ts
import { CACHE } from '@/cache/server/key'

export const PROGRAM_GRAPH = {
  PROGRAM_CREATED: (orgId: string) => [CACHE.PROGRAM(orgId)],
  PROGRAM_UPDATED: (orgId: string, programId: string) => [
    CACHE.PROGRAM(orgId),
    CACHE.PROGRAM(orgId, programId),
    // cross-service : si une autre entité inclut Program, l'invalider ici
  ],
  PROGRAM_DELETED: (orgId: string, programId: string) => [
    CACHE.PROGRAM(orgId),
    CACHE.PROGRAM(orgId, programId),
  ],
} as const

// Pour compatibilité avec l'appel invalidateEvent(PROGRAM_GRAPH.