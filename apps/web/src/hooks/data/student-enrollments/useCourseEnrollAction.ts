// src/hooks/data/student-enrollments/useCourseEnrollAction.ts
// useCourseEnrollAction.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CACHE_KEYS } from "@/config/client_cache";
import type { PersonalCourseItem } from "@/features/personal/services/course";
import { enrollStudentsInPersonalCourseAction } from "@/features/personal/services/student-enrollment";
import type { getStudentsEnrollmentsAction } from "@/services/student-enrollment";

// Enveloppe { data } | { error } mise en cache par useClassEnrollments.
type EnrollmentsResponse = Awaited<ReturnType<typeof getStudentsEnrollmentsAction>>;

export function useCourseEnrollAction(classId: string) {
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.STUDENT_ENROLLMENTS.BY_CLASS(classId);

  const mutation = useMutation({
    mutationFn: ({ course, studentIds }: { course: PersonalCourseItem; studentIds: string[] }) =>
      enrollStudentsInPersonalCourseAction({ courseId: course.id, studentIds }),

    onSuccess: (res, { course, studentIds }) => {
      if (!res.data) return; // échec : le toast est géré par enrollStudentsInCourse

      const groupId = course.group?.id;
      // Cours legacy sans groupe : rien à patcher, on attend le refetch.
      if (!groupId) return queryClient.invalidateQueries({ queryKey });

      // Optimisme basé sur le RETOUR de l'action : seuls les ids réellement ajoutés.
      const failed = new Set(res.data.notAddedStudentIds);
      const added = new Set(studentIds.filter((id) => !failed.has(id)));

      queryClient.setQueryData<EnrollmentsResponse>(queryKey, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((e) =>
            added.has(e.student.id) && !e.studentGroups.some((sg) => sg.group.id === groupId)
              ? {
                ...e,
                studentGroups: [
                  ...e.studentGroups,
                  { id: `optimistic-${e.id}`, group: { id: groupId, name: course.name } },
                ],
              }
              : e,
          ),
        };
      });

      void queryClient.invalidateQueries({ queryKey }); // réconciliation en arrière-plan
    },
  });

  /** Retourne les ids non ajoutés, ou `null` si l'opération a échoué (toast déjà affiché). */
  const enrollStudentsInCourse = async (course: PersonalCourseItem, studentIds: string[]) => {
    try {
      const res = await mutation.mutateAsync({ course, studentIds });

      if (!res.data) {
        toast.error(res.error);
        return null;
      }

      const failed = res.data.notAddedStudentIds;
      if (failed.length > 0) {
        toast.warning(`${studentIds.length - failed.length} ajouté(s), ${failed.length} non ajouté(s)`);
      } else {
        toast.success(`${studentIds.length} étudiant(s) ajouté(s) à « ${course.name} »`);
      }
      return failed;
    } catch {
      toast.error("Une erreur est survenue");
      return null;
    }
  };

  return { enrollStudentsInCourse, isEnrolling: mutation.isPending };
}