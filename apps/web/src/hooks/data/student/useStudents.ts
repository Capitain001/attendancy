"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getStudentsAction } from "@/services/student";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

/** Étudiants de l'org (user inclus). Liste froide → preset DASHBOARD. */
export function useStudents() {
  const { data: response, isLoading } = useQuery({
    queryKey: CACHE_KEYS.STUDENTS.ALL,
    queryFn: () => getStudentsAction(),
    ...QUERY_PRESETS.DASHBOARD,
  });

  // useMemo : référence stable, sinon `?? []` recrée un tableau à chaque render
  const students = useMemo(() => response?.data ?? [], [response]);

  return { students, isLoading, error: response?.error };
}