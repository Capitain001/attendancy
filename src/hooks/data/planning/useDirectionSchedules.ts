"use client";

import { useQuery } from "@tanstack/react-query";
import { PlanningScheduleFilters, planningSchedulesQuery } from "@/services/planning/queries";



/**
 * Schedules de l'org sur une fenêtre de dates (vue direction agrégée).
 * S'hydrate depuis le prefetch serveur si la clé correspond.
 */
export function useDirectionSchedules({ enabled = true, ...filters }: PlanningScheduleFilters) {
  const query = useQuery({
    ...planningSchedulesQuery(filters),
    enabled,
  });

  return {
    schedules: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
