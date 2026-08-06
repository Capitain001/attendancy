// src/services/planning/queries.ts
// Factory pure réutilisable côté serveur (prefetch) ET client (hook).
import { getSchedulesAction, getScheduleDaysAction } from '@/services/schedule/actions'
import type { GetSchedulesReturn } from '@/services/schedule'
import type { ScheduleStatus } from '@/generated/prisma'
import { CACHE_KEYS, QUERY_PRESETS } from '@/cache/client/key'
import { getPlanningRange } from './utils'
import { getOrgPlanningResourcesAction } from './actions'
import type { OrgPlanningResources } from './types'


export interface PlanningScheduleFilters {
  date: string | null;
  classId?: string;
  groupId?: string;
  teacherId?: string;
  roomId?: string;
  status?: ScheduleStatus;
  enabled?: boolean;
}

/**
 * Options de query partagées : même `queryKey` + `queryFn` côté serveur
 * (prefetchQuery) et client (useQuery) -> hydratation garantie.
 */
export function planningSchedulesQuery(
  filters: Omit<PlanningScheduleFilters, "enabled">
) {
  return {
    queryKey: CACHE_KEYS.SCHEDULES.PLANNING(filters),
    queryFn: async (): Promise<GetSchedulesReturn> => {
      const { rangeStart, rangeEnd } = getPlanningRange(filters.date);
      const res = await getSchedulesAction({
        rangeStart,
        rangeEnd,
        classId: filters.classId,
        groupId: filters.groupId,
        teacherId: filters.teacherId,
        roomId: filters.roomId,
        status: filters.status,
      });
      if (res.error || !res.data) {
        throw new Error(res.error ?? "Impossible de récupérer les schedules.");
      }
      return res.data;
    },
    ...QUERY_PRESETS.DASHBOARD,
  };
}

/**
 * Jours (yyyy-MM-dd) ayant des séances pour un mois "yyyy-MM".
 * Une entrée cache par mois — réutilisable serveur (prefetch) + client (hook).
 */
export function scheduleDaysQuery(month: string) {
  return {
    queryKey: CACHE_KEYS.SCHEDULES.DAYS(month),
    queryFn: async (): Promise<string[]> => {
      const res = await getScheduleDaysAction(month);
      if (res.error || !res.data) {
        throw new Error(res.error ?? "Impossible de récupérer les jours.");
      }
      return res.data;
    },
    ...QUERY_PRESETS.DASHBOARD,
  };
}

/**
 * Ressources planning org (classes, enseignants, salles) pour peupler les filtres.
 * Réutilisable serveur (prefetch) + client (hook).
 */
export function orgPlanningResourcesQuery() {
  return {
    queryKey: ["planning", "org-resources"] as const,
    queryFn: async (): Promise<OrgPlanningResources> => {
      const res = await getOrgPlanningResourcesAction();
      if ("error" in res || !res.data) {
        throw new Error(
          ("error" in res && res.error) || "Ressources indisponibles."
        );
      }
      return res.data;
    },
    ...QUERY_PRESETS.STATIC,
  };
}

