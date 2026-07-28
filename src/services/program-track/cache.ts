// src/services/program-track/cache.ts
import { CACHE } from '@/cache/server/key'

export const PROGRAM_TRACK_GRAPH = {
  PROGRAM_TRACK_CREATED: (orgId: string) => [CACHE.PROGRAM_TRACK(orgId)],
  PROGRAM_CREATED:       (orgId: string, programTrackId: string) => [
    CACHE.PROGRAM_TRACK(orgId),
    CACHE.PROGRAM_TRACK(orgId, programTrackId),
  ],
  PROGRAM_UE_UPDATED:    (orgId: string, programTrackId: string) => [
    CACHE.PROGRAM_TRACK(orgId),
    CACHE.PROGRAM_TRACK(orgId, programTrackId),
  ],
} as const
