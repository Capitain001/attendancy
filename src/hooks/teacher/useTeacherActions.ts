"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast/custom-toast";
import {
  createTeacherAction,
  updateTeacherAction,
  deleteTeacherAction,
} from "@/services/teacher/actions";
import type { CreateTeacherInput, UpdateTeacherInput } from "@/services/teacher/validation";
import type { TeacherDTo } from "@/services/teacher/types";

interface UseTeacherActionsOptions {
  onSuccess?: () => void;
}

export function useTeacherActions({ onSuccess }: UseTeacherActionsOptions) {
  const queryClient = useQueryClient();
  const queryKey = ["teachers"];

  const createMutation = useMutation({
    mutationFn: (data: CreateTeacherInput) => createTeacherAction(data),
    onSuccess: (result) => {
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success("Enseignant créé avec succès");
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      }
    },
    onError: () => {
      toast.error("Erreur inattendue lors de la création de l'enseignant");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ teacherId, data }: { teacherId: string; data: UpdateTeacherInput }) =>
      updateTeacherAction(teacherId, data),
    onMutate: async ({ teacherId, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTeachers = queryClient.getQueryData<TeacherDTo[]>(queryKey);
      queryClient.setQueryData<TeacherDTo[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((teacher) =>
          teacher?.id === teacherId
            ? { ...teacher, departmentId: data.departmentId ?? teacher?.departmentId }
            : teacher
        );
      });
      return { previousTeachers };
    },
    onSuccess: (result) => {
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success("Enseignant mis à jour avec succès");
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      }
    },
    onError: (_error, _params, context) => {
      if (context?.previousTeachers) {
        queryClient.setQueryData(queryKey, context.previousTeachers);
      }
      toast.error("Erreur inattendue lors de la mise à jour de l'enseignant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (teacherId: string) => deleteTeacherAction(teacherId),
    onMutate: async (teacherId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTeachers = queryClient.getQueryData<TeacherDTo[]>(queryKey);
      queryClient.setQueryData<TeacherDTo[]>(queryKey, (old) => {
        if (!old) return old;
        return old.filter((teacher) => teacher?.id !== teacherId);
      });
      return { previousTeachers };
    },
    onSuccess: (result) => {
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success("Enseignant supprimé avec succès");
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      }
    },
    onError: (_error, _teacherId, context) => {
      if (context?.previousTeachers) {
        queryClient.setQueryData(queryKey, context.previousTeachers);
      }
      toast.error("Erreur inattendue lors de la suppression");
    },
  });

  return {
    createTeacher: createMutation.mutateAsync,
    updateTeacher: updateMutation.mutateAsync,
    deleteTeacher: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
