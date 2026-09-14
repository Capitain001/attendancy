// src/hooks/data/planning/useScheduleDays.ts
"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths } from "date-fns/addMonths";
import { subMonths } from "date-fns/subMonths";
import { format } from "date-fns/format";

import { scheduleDaysQuery } from "@/services/planning/queries";
import { ScheduleDaysFilterParams } from "@/services/schedule/database";


export type UseScheduleDaysOptions = {
  visibleMonth: Date;
  filters?: ScheduleDaysFilterParams;
};

/**
 * Jours (yyyy-MM-dd) avec séances pour le mois visible.
 * Prefetch silencieux des mois adjacents pour une navigation fluide.
 * @returns Set<"yyyy-MM-dd"> pour un lookup O(1) dans la grille du calendrier.
 */
export function useScheduleDays({ visibleMonth, filters }: UseScheduleDaysOptions) {
  const queryClient = useQueryClient();
  const monthKey = format(visibleMonth, "yyyy-MM");

  const query = useQuery(scheduleDaysQuery({ month: monthKey, filters }));

  const filtersHash = JSON.stringify(filters);

  useEffect(() => {
    const prev = format(subMonths(visibleMonth, 1), "yyyy-MM");
    const next = format(addMonths(visibleMonth, 1), "yyyy-MM");

    queryClient.prefetchQuery(scheduleDaysQuery({ month: prev, filters }));
    queryClient.prefetchQuery(scheduleDaysQuery({ month: next, filters }));
  }, [monthKey, filtersHash, queryClient, filters]);

  return useMemo(() => new Set(query.data ?? []), [query.data]);
}