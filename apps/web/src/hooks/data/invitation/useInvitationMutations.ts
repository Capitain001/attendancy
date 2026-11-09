// src/hooks/data/invitation/useInvitationMutations.ts
"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  resendInvitationAction,
  deleteInvitationUserAction,
  generateMagicLinkAction,
  type InvitationListItem,
} from "@/modules/invitation";
import { CACHE_KEYS } from "@/config/client_cache";

async function unwrapInvitationAction<
  T extends { success: boolean; error?: string },
>(
  action: Promise<T>,
  fallbackMessage: string,
) {
  const result = await action;
  if (!result.success) {
    throw new Error(result.error || fallbackMessage);
  }
  return { ...result, success: true as const };
}

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
  extraKeys: QueryKey[] = [],
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
  onSettled,
}: UseInvitationMutationsOptions = {}) {
  const qc = useQueryClient();
  const invalidate = () => invalidateInvitationQueries(qc, extraInvalidateKeys);

  const resend = useMutation({
    mutationFn: (invitation: InvitationListItem) =>
      unwrapInvitationAction(
        resendInvitationAction(invitation),
        "Relance impossible.",
      ),
    onSuccess: (result) => {
      if (!silentResend)
        toast.success(result.message ?? "Invitation renvoyée");
      onSuccess?.();
    },
    onError: (error) => {
      if (!silentResend) toast.error(error.message);
    },
    onSettled: () => {
      invalidate();
      onSettled?.();
    },
  });

  const revoke = useMutation({
    mutationFn: (invitation: InvitationListItem) =>
      unwrapInvitationAction(
        deleteInvitationUserAction(invitation),
        "Révocation impossible.",
      ),
    onSuccess: (r) => {
      toast.success(r.message ?? "Invitation supprimée");
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => {
      invalidate();
      onSettled?.();
    },
  });

  /**
   * Génère un lien magique et invalide le cache. Ne copie PAS le lien lui-même :
   * selon l'appelant, le lien peut être copié (copyLinkOrToast), envoyé par SMS/WhatsApp,
   * ou partagé via la Web Share API (voir @/lib/invitation/share-link) — décider ça ici
   * forcerait toujours la copie, même quand l'appelant veut router le lien ailleurs.
   */
  const generateMagicLink = useMutation({
    mutationFn: async (invitation: InvitationListItem) => {
      const result = await unwrapInvitationAction(
        generateMagicLinkAction(invitation),
        "Impossible de générer le lien.",
      );
      if (!result.link) {
        throw new Error("Impossible de générer le lien.");
      }
      return { ...result, link: result.link };
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => {
      invalidate();
      onSettled?.();
    },
  });

  return { resend, revoke, generateMagicLink };
}
