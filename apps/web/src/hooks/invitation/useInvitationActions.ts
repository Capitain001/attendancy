"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  resendInvitationAction,
  generateMagicLinkAction,
  deleteInvitationUserAction,
  InvitationActionResult,
} from "@/services/invite";
import type { InvitationListItem } from "@/services/invite";
import { CACHE_KEYS } from "@/config/client_cache";


interface UseInvitationActionsOptions {
  onSuccess?: () => void;
  /**
   * Tait le toast de succès unitaire du renvoi. À activer quand l'appelant
   * gère lui-même un retour groupé (ex. relance de masse → 1 toast récap).
   */
  silentResend?: boolean;
}

/**
 * Hook pour gérer les actions d'invitation avec mise à jour optimiste
 *
 * @param options - Options du hook
 * @returns Fonctions et états pour les actions d'invitation
 */
export function useInvitationActions({ onSuccess, silentResend }: UseInvitationActionsOptions = {}) {
  const queryClient = useQueryClient();
  const queryKey = CACHE_KEYS.INVITATIONS.ALL;

  // Mutation pour renvoyer une invitation
  const resendMutation = useMutation({
    mutationFn: (invitation: InvitationListItem) => resendInvitationAction(invitation),
    onMutate: async (invitation) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey });

      // Snapshot de la valeur précédente
      const previousInvitations = queryClient.getQueryData<InvitationListItem[]>(queryKey);

      // Mise à jour optimiste : mettre à jour la date d'expiration
      queryClient.setQueryData<InvitationListItem[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((inv) =>
          inv.id === invitation.id
            ? {
                ...inv,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
              }
            : inv
        );
      });

      return { previousInvitations };
    },
    onSuccess: (result) => {
      if (result.success) {
        if (!silentResend) {
          toast.success(result.message || "Invitation renvoyée avec succès");
        }
        // Invalider les invitations - les stats se mettront à jour automatiquement
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      } else if (!silentResend) {
        const errorResult = result as { success: false; error: string };
        toast.error(errorResult.error || "Erreur lors du renvoi de l'invitation");
      }
    },
    onError: (error, invitation, context) => {
      // Restaurer la valeur précédente en cas d'erreur
      if (context?.previousInvitations) {
        queryClient.setQueryData(queryKey, context.previousInvitations);
      }
      if (!silentResend) {
        toast.error("Erreur inattendue lors du renvoi de l'invitation");
      }
    },
  });

  // Mutation pour générer un lien magique
  const generateLinkMutation = useMutation({
    mutationFn: (invitation: InvitationListItem) => generateMagicLinkAction(invitation),
    onSuccess: async (result) => {
      if (result.success && result.link) {
        // Copier le lien dans le presse-papiers
        try {
          await navigator.clipboard.writeText(result.link);
          toast.success("Lien magique généré et copié dans le presse-papiers");
        } catch (error) {
          toast.success("Lien magique généré", {
            description: result.link,
            duration: 10000,
          });
        }
        // Invalider les invitations - les stats se mettront à jour automatiquement
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      } else {
        const errorResult = result as { success: false; error: string };
        toast.error(errorResult.error || "Erreur lors de la génération du lien");
      }
    },
    onError: () => {
      toast.error("Erreur inattendue lors de la génération du lien");
    },
  });

  // Mutation pour supprimer une invitation
  const deleteMutation = useMutation({
    mutationFn: (invitation: InvitationListItem) => deleteInvitationUserAction(invitation),
    onMutate: async (invitation) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey });

      // Snapshot de la valeur précédente
      const previousInvitations = queryClient.getQueryData<InvitationListItem[]>(queryKey);

      // Mise à jour optimiste : supprimer l'invitation de la liste
      queryClient.setQueryData<InvitationListItem[]>(queryKey, (old) => {
        if (!old) return old;
        return old.filter((inv) => inv.id !== invitation.id);
      });

      return { previousInvitations };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || "Invitation supprimée avec succès");
        // Invalider les invitations - les stats se mettront à jour automatiquement
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.();
      } else {
        const errorResult = result as { success: false; error: string };
        toast.error(errorResult.error || "Erreur lors de la suppression");
      }
    },
    onError: (error, invitation, context) => {
      // Restaurer la valeur précédente en cas d'erreur
      if (context?.previousInvitations) {
        queryClient.setQueryData(queryKey, context.previousInvitations);
      }
      toast.error("Erreur inattendue lors de la suppression");
    },
  });

  return {
    // Actions - typer explicitement pour éviter les problèmes de type
    resendInvitation: resendMutation.mutateAsync as (invitation: InvitationListItem) => Promise<InvitationActionResult>,
    generateMagicLink: generateLinkMutation.mutateAsync as (invitation: InvitationListItem) => Promise<InvitationActionResult>,
    deleteInvitation: deleteMutation.mutateAsync as (invitation: InvitationListItem) => Promise<InvitationActionResult>,

    // États de chargement
    isResending: resendMutation.isPending,
    isGeneratingLink: generateLinkMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: resendMutation.isPending || generateLinkMutation.isPending || deleteMutation.isPending,

    // États de copie (pour le lien magique)
    copiedLink: false, // Géré localement dans le composant si nécessaire
  };
}
