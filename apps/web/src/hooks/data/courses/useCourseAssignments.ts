"use client";

import {
  assignTeacherAction,
  deleteTeacherAction,
  getCourseTeachersIdAction
} from "@/services/course-teacher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCourseAssignments = (courseId: string) => {
  const queryClient = useQueryClient();

  // Récupérer les IDs des enseignants assignés au cours
  const { 
    data: assignments = [], 
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments 
  } = useQuery({
    queryKey: ["courseAssignments", courseId],
    queryFn: async () => {
      const result = await getCourseTeachersIdAction(courseId);
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    enabled: !!courseId,
  });

  // Fonction commune pour mettre à jour le cache optimistiquement
  const updateAssignmentsCache = (updater: (old: any[]) => any[]) => {
    queryClient.setQueryData(["courseAssignments", courseId], updater);
  };

  // Mutation pour assigner un enseignant
  const assignMutation = useMutation({
    mutationFn: async ({
      teacherId,
      isMain = false,
    }: {
      teacherId: string;
      isMain?: boolean;
    }) => {
      const result = await assignTeacherAction({
        courseId,
        teacherId,
        isMain
      });

      if ("error" in result) throw new Error(result.error);
      return result.data;
    },

    onMutate: async ({ teacherId, isMain }) => {
      // Mise à jour optimiste
      updateAssignmentsCache((old: any[] = []) => {
        // Si on définit comme principal, on retire le statut principal des autres
        const updatedAssignments = isMain 
          ? old.map(item => ({ ...item, isMain: false }))
          : [...old];
        
        // Ajouter ou mettre à jour l'assignation
        const existingIndex = updatedAssignments.findIndex(
          item => item.id === teacherId
        );
        
        if (existingIndex >= 0) {
          updatedAssignments[existingIndex] = { 
            ...updatedAssignments[existingIndex], 
            isMain 
          };
        } else {
          updatedAssignments.push({ id: teacherId, isMain });
        }
        
        return updatedAssignments;
      });

      return null;
    },

    onError: (error: Error) => {
      // En cas d'erreur, on invalide pour récupérer l'état correct
      queryClient.invalidateQueries({ 
        queryKey: ["courseAssignments", courseId] 
      });
      toast.error(error.message || "Échec de l'assignation");
    },

    onSuccess: () => {
      toast.success("Enseignant assigné avec succès");
    },
  });

  // Mutation pour désassigner un enseignant
  const unassignMutation = useMutation({
    mutationFn: async ({ courseTeacherId }: { courseTeacherId: string }) => {
      const result = await deleteTeacherAction(courseTeacherId);

      if ("error" in result) throw new Error(result.error);
      return result.data;
    },

    onMutate: async ({ courseTeacherId }) => {
      // Retrait optimiste
      updateAssignmentsCache((old: any[] = []) =>
        old.filter(item => item.id !== courseTeacherId)
      );
    },

    onError: (error: Error) => {
      queryClient.invalidateQueries({ 
        queryKey: ["courseAssignments", courseId] 
      });
      toast.error(error.message || "Échec de la désassignation");
    },

    onSuccess: () => {
      toast.success("Enseignant désassigné avec succès");
    },
  });

  //  pour définir un enseignant comme principal
  const setMainTeacher = (teacherId: string) => {
    assignMutation.mutate({ teacherId, isMain: true });
  };

  return {
    // Données
    assignments,
    
    // Actions
    assignTeacher: assignMutation.mutate,
    unassignTeacher: unassignMutation.mutate,
    setMainTeacher,
    
    // États
    isLoading: isLoadingAssignments,
    isAssigning: assignMutation.isPending,
    isUnassigning: unassignMutation.isPending,
    isSettingMain: assignMutation.isPending,
    
    // Pour rafraîchissement manuel
    refetchAssignments,
  };
};