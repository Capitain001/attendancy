"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { enrollStudentsInClassAction } from "@/services/student-enrollment";
import { CACHE_KEYS } from "@/config/client_cache";

/** Inscription en masse (best-effort côté serveur : un résultat par étudiant). */
export function useEnrollStudentsAction(classId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // Une `{ error }` serveur devient un vrai rejet → onError, et `data` est garanti ensuite.
    mutationFn: async (studentIds: string[]) => {
      const res = await enrollStudentsInClassAction({ classId, studentIds });
      if (res.error || !res.data) throw new Error(res.error ?? "Erreur lors de l'inscription.");
      return res.data; // EnrollmentMutationResult[]
    },

    // Succès de la requête ≠ succès métier : le toast résume le rapport partiel.
    onSuccess: (results) => {
      const failed = results.filter((r) => r.status === "failed").length;
      const ok = results.length - failed;

      if (failed === results.length) {
        toast.error("Toutes les inscriptions ont échoué.");
      } else if (failed > 0) {
        toast.warning(`${ok} inscrit${ok > 1 ? "s" : ""}, ${failed} échoué${failed > 1 ? "s" : ""}.`);
      } else {
        toast.success(`${ok} étudiant${ok > 1 ? "s" : ""} inscrit${ok > 1 ? "s" : ""}.`);
      }
    },

    onError: (e: Error) => toast.error(e.message),

    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: CACHE_KEYS.STUDENT_ENROLLMENTS.BY_CLASS(classId),
      }),
  });

  return {
    enrollStudents: mutation.mutateAsync, // → Promise<EnrollmentMutationResult[]>
    isEnrolling: mutation.isPending,
  };
}