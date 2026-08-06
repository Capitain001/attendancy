// src/cache/client/keys.ts
// Registre métier des clés de cache React Query. Ce fichier ne contient QUE
// le vocabulaire applicatif (quelles entités, quelles variantes) — le
// mécanisme (entityKeys, subKey, durées, presets) vit dans ./engine.
//
// Exemple ci-dessous, à remplacer par le vocabulaire réel du projet.
import { entityKeys, subKey } from "./engine";

export const CACHE_KEYS = {
  ATTENDANCES: {
    BY_SCHEDULE: subKey("attendances", "by-schedule"),
  },
  SCHEDULES: {
    PLANNING: (filters: Record<string, unknown>) => ["schedules", "planning", filters] as const,
    DAYS: (month: string) => ["schedules", "days", month] as const,
    NEXT: (teacherId: string) => ["schedules", "next", teacherId] as const,
  },
  SESSIONS: {
    ACTIVE: ["sessions", "active"] as const,
  },
  FUNCTIONS: {
    MAIN_WITH_USERS: ["functions", "main-with-users"] as const,
    ALL: ["functions", "all"] as const,
  },
  NOTIFICATIONS: {
    ALL: ["notifications"] as const,
  },
  INVITATIONS: {
    ORG: ["invitations", "org"] as const,
    BY_CLASS: (classId: string) => ["invitations", "by-class", classId] as const,
    STATS: ["invitations", "stats"] as const,
  },
  PROGRAMS: {
    BY_ID: (programId: string) => ["programs", programId] as const,
    ALL: ["programs", "all"] as const,
  },
  GROUPS: {
    BY_CLASS: (classId: string) => ["groups", "by-class", classId] as const,
    ELIGIBLE: (classId: string, groupId: string) => ["groups", "eligible", classId, groupId] as const,
  },
} as const;

export type CacheKeys = typeof CACHE_KEYS;

// Ré-exports pratiques pour les call sites qui n'ont besoin que du registre.
export { CACHE_TIME, QUERY_PRESETS } from "./engine";