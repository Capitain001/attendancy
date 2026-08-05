"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeacherStatsAction } from "@/services/teacher/actions";
import type { GetTeacherStatsDto } from "@/services/teacher/types";

/**
 * Hook pour récupérer les statistiques d'un enseignant
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTeacherStats({
 *   teacherId: "teacher-123"
 * });
 * ```
 */
export function useTeacherStats({
  teacherId,
  enabled = true,
}: {
  teacherId?: string;
  enabled?: boolean;
}) {
  const { data, isLoading, error, isError } = useQuery<GetTeacherStatsDto>({
    queryKey: ["teacher-stats", teacherId],
    queryFn: async () => {
      if (!teacherId) {
        throw new Error("ID enseignant manquant");
      }
      const response = await getTeacherStatsAction(teacherId);
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: enabled && !!teacherId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data,
    isLoading,
    error: error instanceof Error ? error.message : null,
    isError,
  };
}

