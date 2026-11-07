"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { removeStudentEnrollmentAction } from "@/services/student-enrollment";
import { CACHE_KEYS } from "@/config/client_cache";

export function useRemoveStudentEnrollment(classId: string) {
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.STUDENT_ENROLLMENTS.BY_CLASS(classId);

  const mutation = useMutation({
    mutationFn: async (studentEnrollmentId: string) => {
      const result = await removeStudentEnrollmentAction(studentEnrollmentId);
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => toast.success("Étudiant retiré de la classe."),
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    removeStudentEnrollment: mutation.mutate,
    isRemoving: mutation.isPending,
  };
}
