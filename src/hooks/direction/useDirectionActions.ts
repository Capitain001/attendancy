// src/hooks/direction/useDirectionActions.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignFunctionsToMemberAction,
  revokeFunctionsFromMemberAction,
  updateMemberFunctionsAction,
  deleteDirectionMemberAction,
} from "@/services/direction/actions";
import type { AssignFunctionsParams, GetDirectionMembersDto } from "@/services/direction/types";

interface UseDirectionActionsOptions {
  organizationId: string;
  onSuccess?: () => void;
}

/**
 * Hook pour gérer les actions sur les membres de la direction avec mise à jour optimiste
 * 
 * @param options - Options du hook
 * @returns Fonctions et états pour les actions
 */
export function useDirectionActions({ organizationId, onSuccess }: UseDirectionActionsOptions) {
  const queryClient = useQueryClient();
  const queryKey = ["directions", organizationId];

  // Mutation pour assigner des fonctions
  const assignFunctionsMutation = useMutation({
    mutationFn: (params: AssignFunctionsParams) => assignFunctionsToMemberAction(params),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey });

      // const previousMembers = queryClient.getQueryData<GetDirectionMembersDto[]>(queryKey);

  const previousMembers = null
      return { previousMembers };
    },
    onSuccess: (result) => {
      if ('error' in result) {
        toast.error(result.error || "Erreur lors de l'assignation des fonctions");
      } else {
        toast.success("Fonctions assignées avec succès");
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      }
    },
    onError: (error, params, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKey, context.previousMembers);
      }
      toast.error("Erreur inattendue lors de l'assignation des fonctions");
    },
  });

  // Mutation pour révoquer des fonctions
  const revokeFunctionsMutation = useMutation({
    mutationFn: ({ userId, functionIds }: { userId: string; functionIds: string[] }) =>
      revokeFunctionsFromMemberAction(userId, functionIds),
    onMutate: async ({ userId, functionIds }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousMembers = queryClient.getQueryData<GetDirectionMembersDto[]>(queryKey);

      // Mise à jour optimiste : retirer les fonctions du membre
     
      return { previousMembers };
    },
    onSuccess: (result) => {
      if ('error' in result) {
        toast.error(result.error || "Erreur lors de la révocation des fonctions");
      } else {
        toast.success("Fonctions révoquées avec succès");
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      }
    },
    onError: (error, params, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKey, context.previousMembers);
      }
      toast.error("Erreur inattendue lors de la révocation des fonctions");
    },
  });

  // Mutation pour mettre à jour les fonctions (remplace toutes)
  const updateFunctionsMutation = useMutation({
    mutationFn: (params: AssignFunctionsParams) => updateMemberFunctionsAction(params),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey });

      const previousMembers = queryClient.getQueryData<GetDirectionMembersDto[]>(queryKey);

      // Mise à jour optimiste : remplacer les fonctions
      // On attendra la réponse du serveur pour avoir les bonnes données
      return { previousMembers };
    },
    onSuccess: (result) => {
      if ('error' in result) {
        toast.error(result.error || "Erreur lors de la mise à jour des fonctions");
      } else {
        toast.success("Fonctions mises à jour avec succès");
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      }
    },
    onError: (error, params, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKey, context.previousMembers);
      }
      toast.error("Erreur inattendue lors de la mise à jour des fonctions");
    },
  });

  // Mutation pour supprimer un membre
  const deleteMutation = useMutation({
    mutationFn: (directionId: string) => deleteDirectionMemberAction(directionId),
    onMutate: async (directionId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousMembers = queryClient.getQueryData<GetDirectionMembersDto[]>(queryKey);

      // Mise à jour optimiste : supprimer le membre de la liste
      queryClient.setQueryData<GetDirectionMembersDto[]>(queryKey, (old) => {
        if (!old) return old;
        return old.filter((member) => member?.id !== directionId);
      });

      return { previousMembers };
    },
    onSuccess: (result) => {
      if ('error' in result) {
        toast.error(result.error || "Erreur lors de la suppression");
      } else {
        toast.success("Membre supprimé avec succès");
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      }
    },
    onError: (error, directionId, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKey, context.previousMembers);
      }
      toast.error("Erreur inattendue lors de la suppression");
    },
  });

  return {
    // Actions
    assignFunctions: assignFunctionsMutation.mutateAsync as (params: AssignFunctionsParams) => Promise<{ success: boolean; error?: string; message?: string }>,
    revokeFunctions: revokeFunctionsMutation.mutateAsync as (params: { userId: string; functionIds: string[] }) => Promise<{ success: boolean; error?: string; message?: string }>,
    updateFunctions: updateFunctionsMutation.mutateAsync as (params: AssignFunctionsParams) => Promise<{ success: boolean; error?: string; message?: string }>,
    deleteMember: deleteMutation.mutateAsync as (directionId: string) => Promise<{ success: boolean; error?: string; message?: string }>,

    // États de chargement
    isAssigning: assignFunctionsMutation.isPending,
    isRevoking: revokeFunctionsMutation.isPending,
    isUpdating: updateFunctionsMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: assignFunctionsMutation.isPending || revokeFunctionsMutation.isPending || updateFunctionsMutation.isPending || deleteMutation.isPending,
  };
}

