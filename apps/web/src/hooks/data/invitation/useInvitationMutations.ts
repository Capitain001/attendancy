// src/hooks/data/invitation/useInvitationMutations.ts
"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  resendInvitationAction,
  deleteInvitationUserAction,
  generateMagicLinkAction,
  type InvitationListItem,
} from "@/modules/invitation";
import { CACHE_KEYS } from "@/config/client_cache";

/**
 * Copie le lien dans le presse-papiers, avec fallback toast (description + durée longue)
 * si le clipboard échoue (permissions navigateur, contexte non sécurisé, etc.)
 * Point de vérité unique — évite de réécrire ce try/catch à chaque endroit qui génère un lien.
 */
export async function copyLinkOrToast(link: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(link);
    toast.success(successMessage);
  } catch {
    toast.success(successMessage, { description: link, duration: 10000 });
  }
}

/**
 * Invalide la liste globale + stats, plus toute portée additionnelle (ex: BY_CLASS(classId)).
 * Exporté pour être réutilisé par les mutations `inviteTeacher`/`inviteDirection`/`inviteStudent`,
 * qui ont besoin de la même invalidation sans passer par resend/revoke/generateMagicLink.
 */
export function invalidateInvitationQueries(
  qc: ReturnType<typeof useQueryClient>,
  extraKeys: QueryKey[] = []
) {
  qc.invalidateQueries({ queryKey: CACHE_KEYS.INVITATIONS.ALL });
  qc.invalidateQueries({ queryKey: CACHE_KEYS.INVITATIONS.STATS });
  extraKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
}

interface UseInvitationMutationsOptions {
  /** Query keys supplémentaires à invalider en plus de la liste globale + stats (ex: BY_CLASS(classId)) */
  extraInvalidateKeys?: QueryKey[];
  /** Tait le toast de succès/erreur unitaire du renvoi (pratique pour les relances de masse). */
  silentResend?: boolean;
  /** Callback appelé après un succès de mutation (renvoi, révocation, etc.) pour fermer une modale par ex. */
  onSuccess?: () => void;
  /** Callback appelé à la fin d'une mutation, succès ou échec. */
  onSettled?: () => void;
}

/**
 * Mutations bas niveau communes à tous les écrans d'invitation (org, classe, étudiant) :
 * resend / revoke / generateMagicLink.
 *
 * Invalide systématiquement ALL + STATS en plus de la portée passée par l'appelant, pour
 * qu'un resend/revoke fait depuis un écran scopé (ex: classe) rafraîchisse aussi les listes
 * globales où la même invitation peut apparaître.
 */
export function useInvitationMutations({ 
  extraInvalidateKeys = [], 
  silentResend = false,
  onSuccess,
  onSettled
}: UseInvitationMutationsOptions = {}) {
  const qc = useQueryClient();
  // Toutes les listes où l'invitation peut apparaître en cache — ALL (hub Direction)
  // et toute portée additionnelle (ex: BY_CLASS(classId)) passée par l'appelant.
  const targetKeys = [CACHE_KEYS.INVITATIONS.ALL, ...extraInvalidateKeys];
  const invalidate = () => invalidateInvitationQueries(qc, extraInvalidateKeys);

  const resend = useMutation({
    mutationFn: resendInvitationAction,
    onMutate: async (invitation: InvitationListItem) => {
      await Promise.all(targetKeys.map((key) => qc.cancelQueries({ queryKey: key })));

      // Snapshot par clé, pour rollback ciblé si l'appel échoue.
      const snapshots = targetKeys.map(
        (key) => [key, qc.getQueryData<InvitationListItem[]>(key)] as const
      );

      for (const key of targetKeys) {
        qc.setQueryData<InvitationListItem[]>(key, (old) => {
          if (!old) return old;
          return old.map((inv) =>
            inv.id === invitation.id
              ? { ...inv, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } // +7 jours
              : inv
          );
        });
      }

      return { snapshots };
    },
    onSuccess: (r) => {
      if (!r.success) {
        if (!silentResend) toast.error(r.error ?? "Relance impossible.");
        return;
      }
      invalidate();
      if (!silentResend) toast.success(r.message ?? "Invitation renvoyée");
      onSuccess?.();
    },
    onError: (_err, _invitation, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      if (!silentResend) toast.error("Relance impossible.");
    },
    onSettled: () => onSettled?.(),
  });

  const revoke = useMutation({
    mutationFn: deleteInvitationUserAction,
    onMutate: async (invitation: InvitationListItem) => {
      await Promise.all(targetKeys.map((key) => qc.cancelQueries({ queryKey: key })));

      const snapshots = targetKeys.map(
        (key) => [key, qc.getQueryData<InvitationListItem[]>(key)] as const
      );

      for (const key of targetKeys) {
        qc.setQueryData<InvitationListItem[]>(key, (old) =>
          old ? old.filter((inv) => inv.id !== invitation.id) : old
        );
      }

      return { snapshots };
    },
    onSuccess: (r) => {
      if (!r.success) {
        toast.error(r.error ?? "Révocation impossible.");
        return;
      }
      invalidate();
      toast.success(r.message ?? "Invitation supprimée");
      onSuccess?.();
    },
    onError: (_err, _invitation, context) => {
      context?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Révocation impossible.");
    },
    onSettled: () => onSettled?.(),
  });

  /**
   * Génère un lien magique et invalide le cache. Ne copie PAS le lien lui-même :
   * selon l'appelant, le lien peut être copié (copyLinkOrToast), envoyé par SMS/WhatsApp,
   * ou partagé via la Web Share API (voir @/lib/invitation/share-link) — décider ça ici
   * forcerait toujours la copie, même quand l'appelant veut router le lien ailleurs.
   */
  const generateMagicLink = useMutation({
    mutationFn: generateMagicLinkAction,
    onSuccess: (r) => {
      if (!r.success || !r.link) {
        const err = r as { success: false; error: string };
        toast.error(err.error ?? "Impossible de générer le lien");
        return;
      }
      invalidate();
      onSuccess?.();
    },
    onError: () => toast.error("Impossible de générer le lien"),
    onSettled: () => onSettled?.(),
  });

  return { resend, revoke, generateMagicLink };
}
