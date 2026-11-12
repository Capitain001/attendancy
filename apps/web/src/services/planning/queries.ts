// src/services/planning/queries.ts
// Factory pure réutilisable côté serveur (prefetch) ET client (hook).
import { format } from 'date-fns'

import { getSchedulesAction, getScheduleDaysAction, getTeacherSchedulesAction, getTeacherDailyScheduleAction } from '@/services/schedule/actions'
import type { GetScheduleDaysInput, GetSchedulesDto } from '@/services/schedule'
import { getStudentScheduleAction } from '@/services/student/actions'
import type { GetStudentSchedulesDto } from '@/services/student'

import { CACHE_KEYS, QUERY_PRESETS } from '@/cache/client/key'
import { getPlanningRange } from './utils'
import { getOrgPlanningResourcesAction, getPlanningResourcesAction } from './actions'
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
    queryFn: async (): Promise<GetSchedulesDto> => {
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
 * Preset RETAINED : l'utilisateur navigue de jour en jour, on garde donc les
 * jours déjà visités en cache (gcTime long) pour éviter un refetch au retour.
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
    ...QUERY_PRESETS.RETAINED,
  };
}

export type StudentMonthScheduleFilters = {
  classId: string;
  groupIds: string[];
  date: string | null; // ISO YYYY-MM-DD
};

/**
 * Séances complètes d'un étudiant pour le mois entier (déduit de `date`).
 * Une entrée cache par (classe, groupes, mois). La navigation jour par jour
 * filtre ensuite en mémoire, sans requête serveur.
 * Preset RETAINED : les mois déjà visités restent en cache (gcTime long).
 */
export function studentMonthSchedulesQuery(filters: StudentMonthScheduleFilters) {
  const { rangeStart, rangeEnd } = getPlanningRange(filters.date);
  const monthKey = format(rangeStart, "yyyy-MM");
  const groupIdsKey = [...filters.groupIds].sort().join(",");

  return {
    queryKey: CACHE_KEYS.SCHEDULES.STUDENT_MONTH({
      classId: filters.classId,
      groupIdsKey,
      monthKey,
    }),
    queryFn: async (): Promise<GetStudentSchedulesDto> => {
      const res = await getStudentScheduleAction({
        classId: filters.classId,
        groupIds: filters.groupIds,
        rangeStart,
        rangeEnd,
      });
      if ("error" in res && res.error) {
        throw new Error(res.error);
      }
      return res.data ?? [];
    },
    ...QUERY_PRESETS.RETAINED,
  };
}

/**
 * Ressources planning d'UNE classe (cours, salles, groupes) pour le formulaire de séance.
 * Une entrée cache par classe. Réutilisable serveur (setQueryData / prefetch) + client (hook).
 */
export function planningResourcesQuery(classId: string) {
  return {
    queryKey: CACHE_KEYS.PLANNING.RESOURCES(classId),
    queryFn: async () => {
      const res = await getPlanningResourcesAction(classId);
      if ("error" in res || !res.data) {
        throw new Error(
          ("error" in res && res.error) || "Impossible de charger les options du formulaire."
        );
      }
      return res.data;
    },
    ...QUERY_PRESETS.STATIC,
  };
}

/* 
. Invalidation à prévoir

Avec un preset statique, un cours ou une salle créé ailleurs n’apparaîtra pas tant que le cache n’est pas invalidé. Dans les mutations de création et de modification de cours ou de salles :

ts
queryClient.invalidateQueries({ queryKey: ["planning", "resources"] });
*/