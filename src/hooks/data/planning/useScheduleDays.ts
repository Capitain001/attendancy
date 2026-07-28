"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths } from "date-fns/addMonths";
import { subMonths } from "date-fns/subMonths";
import { format } from "date-fns/format";

import { scheduleDaysQuery } from "@/services/planning/queries";

/**
 * Jours (yyyy-MM-dd) avec séances pour le mois visible.
 * Prefetch silencieux des mois adjacents pour une navigation fluide.
 * @returns Set<"yyyy-MM-dd"> pour un lookup O(1) dans les modifiers du Calendar.
 */
export function useScheduleDays(visibleMonth: Date) {
  const queryClient = useQueryClient();
  const monthKey = format(visibleMonth, "yyyy-MM");

  const { data } = useQuery(scheduleDaysQuery(monthKey));

  useEffect(() => {
    const prev = format(subMonths(visibleMonth, 1), "yyyy-MM");
    const next = format(addMonths(visibleMonth, 1), "yyyy-MM");
    queryClient.prefetchQuery(scheduleDaysQuery(prev));
    queryClient.prefetchQuery(scheduleDaysQuery(next));
  }, [visibleMonth, queryClient]);

  return new Set(data ?? []);
}
