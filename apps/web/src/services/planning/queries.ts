// src/services/planning/queries.ts
// Factory pure réutilisable côté serveur (prefetch) ET client (hook).
import { getSchedulesAction, getScheduleDaysAction, getTeacherSchedulesAction } from '@/services/schedule/actions'
import type { GetScheduleDaysInput, GetSchedulesReturn } from '@/services/schedule'

import { CACHE_KEYS, QUERY_PRESETS } from '@/cache/client/key'
import { getPlanningRange } from './utils'
import { getOrgPlanningResourcesAction } from './actions'
import type { OrgPlanningResources } from './types'
import { ScheduleStatus } from '@/generated/prisma/browser'
import { ScheduleDaysFilterParams } from '../schedule/database'


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
export function scheduleDaysQuery(input: GetScheduleDaysInput) {
  return {
    queryKey: CACHE_KEYS.SCHEDULES.DAYS(input.month, input.filters),
    queryFn: async (): Promise<string[]> => {
      const res = await getScheduleDaysAction(input)
      if (res.error || !res.data) {
        throw new Error(res.error ?? "Impossible de récupérer les jours.")
      }
      return res.data
    },
    ...QUERY_PRESETS.DASHBOARD,
  }
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

export type GetTeacherDaySchedulesInput = {
  teacherId: string;
  dayKey: string;
};

/**
 * Séances complètes d'un enseignant pour UN jour (yyyy-MM-dd).
 * Une entrée cache par (teacherId, jour) — alimente le détail affiché sous
 * le calendrier, séparément de scheduleDaysQuery (liste des jours seulement,
 * pour la grille de points).
 */
export function teacherDaySchedulesQuery({ teacherId, dayKey }: GetTeacherDaySchedulesInput) {
  const rangeStart = new Date(`${dayKey}T00:00:00`);
  const rangeEnd = new Date(`${dayKey}T23:59:59.999`);

  return {
    queryKey: CACHE_KEYS.SCHEDULES.TEACHER_DAY({ teacherId, dayKey }),
    queryFn: async () => {
      const res = await getTeacherSchedulesAction({ teacherId, rangeStart, rangeEnd });
      if ("error" in res && res.error) {
        throw new Error(res.error);
      }
      return res.data ?? [];
    },
    ...QUERY_PRESETS.DASHBOARD,
  };
}