"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getStudentsEnrollmentsAction } from "@/services/student-enrollment";
import { CACHE_KEYS, QUERY_PRESETS } from "@/config/client_cache";

/** Inscriptions ACTIVES d'une classe (endedAt = null, défaut côté serveur). */
export function useClassEnrollments(classId: string) {
  const { data: response, isLoading } = useQuery({
    queryKey: CACHE_KEYS.STUDENT_ENROLLMENTS.BY_CLASS(classId),
    queryFn: () => getStudentsEnrollmentsAction({ classId }),
    enabled: !!classId,
    ...QUERY_PRESETS.LIVE,
  });

  const enrollments = useMemo(() => response?.data ?? [], [response]);

  return { enrollments, isLoading, error: response?.error };
}