// src/hooks/data/courses/useCourseTeachers.ts
"use client";

import { useCallback } from "react";
import { useEntity } from "@/hooks/entity/useEntity";
import { getCourseTeachersAction } from "@/services/course";
import type { CourseTeacher } from "@/services/course";

/**
 * Hook pour récupérer les enseignants assignés à un cours
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useCourseTeachers({ courseId: "course-123" });
 *
 * // Avec options personnalisées
 * const teachers = useCourseTeachers({ 
 *   courseId: "course-123",
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 *   enabled: !!courseId
 * });
 * ```
 */
export function useCourseTeachers({
  courseId,
  staleTime,
  enabled = true,
}: {
  courseId: string;
  staleTime?: number;
  enabled?: boolean;
}) {
  const fetchFn = useCallback(async () => {
    if (!courseId) throw new Error("courseId est requis");

    const response = await getCourseTeachersAction(courseId);

    if ( "error" in response) throw new Error(response.error);
    return response.data || [];
  }, [courseId]);

  const entityName = `course-teachers-${courseId}`;

  const entity = useEntity<CourseTeacher>({
    entityName,
    fetchFn,
    enabled: enabled && !!courseId,
    staleTime,
    revalidateMode: "invalidate",
  });

  return { ...entity };
}
