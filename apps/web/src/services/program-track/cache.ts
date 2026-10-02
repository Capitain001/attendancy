// src/services/program-track/cache.ts
import { CACHE } from '@/cache/server/key';

export const PROGRAM_TRACK_GRAPH = {
  PROGRAM_TRACK_CREATED: (orgId: string) => [
    CACHE.PROGRAM_TRACK(orgId),
  ],
  PROGRAM_TRACK_UPDATED: (orgId: string, programTrackId: string) => [
    CACHE.PROGRAM_TRACK(orgId),
    CACHE.PROGRAM_TRACK(programTrackId),
    CACHE.CLASS(orgId),
    CACHE.PROGRAM(orgId),
  ],
  PROGRAM_TRACK_DELETED: (orgId: string, programTrackId: string) => [
    CACHE.PROGRAM_TRACK(orgId),
    CACHE.PROGRAM_TRACK(programTrackId),
    CACHE.CLASS(orgId),
    CACHE.PROGRAM(orgId),
  ],
} as const
