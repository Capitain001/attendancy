// src/hooks/data/courses/useSyncCourseTeachers.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { syncCourseTeachersAction } from "@/services/course-teacher";
import { toast } from "@/lib/toast/custom-toast";

/**
 * Mutation : remplace intégralement les enseignants d'un cours (principal +
 * assistants). Invalide le cache React Query des affectations
 * (`course-teachers-<courseId>`, lu par useCourseTeachers) et rafraîchit le
 * RSC parent (le détail cours embarque les enseignants).
 */
export function useSyncCourseTeachers(courseId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (input: { principalId: string; assistantIds: string[] }) => {
      const res = await syncCourseTeachersAction({ courseId, ...input });
      if ("error" in res) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`course-teachers-${courseId}`] });
      router.refresh();
      toast.success("Enseignants mis à jour");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Échec de la mise à jour des enseignants");
    },
  });

  return {
    sync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    syncError: mutation.error,
  };
}
