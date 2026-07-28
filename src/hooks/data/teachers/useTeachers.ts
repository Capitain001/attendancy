"use client";
// src/hooks/data/teachers/useTeachers.ts
//@ts-ignore

import { useCallback } from "react";
import { useEntity } from "@/hooks/entity/useEntity";
import { getTeachersAction } from "@/services/teacher/actions";
import type { TeacherDTo } from "@/services/teacher/types";

/**
 * Hook pour récupérer les teachers d'une organisation
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useTeachers({
 *   departmentId: "dep-123",
 *   status: "ACTIVE"
 * });
 * ```
 */
export function useTeachers({
  departmentId,
  status,
  staleTime,
  enabled = true,
}: {
  departmentId?: string;
  status?: "ACTIVE" | "INACTIVE";
  staleTime?: number;
  enabled?: boolean;
}) {
  const fetchFn = useCallback(async () => {
    const response = await getTeachersAction(departmentId);

    if ("error" in response) {
      throw new Error(response.error);
    }
    return response.data || [];
  }, [departmentId, status]);

  const entityName = `teachers-${departmentId}-${status}`;
//@ts-ignore
  const entity = useEntity<TeacherDTo>({
    entityName,
    fetchFn,
    enabled,
    staleTime,
    revalidateMode: "invalidate",
  });

  return {
    ...entity,
  };
}
