"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  resendInvitationAction,
  generateMagicLinkAction,
  type InvitationActionResult,
} from "@/services/invite";
import type { InvitationListItem } from "@/services/invite";

interface UseStudentInvitationActionsOptions {
  onSettled?: () => void;
}

export function useStudentInvitationActions({
  onSettled,
}: UseStudentInvitationActionsOptions = {}) {
  const [busyKind, setBusyKind] = useState<null | "resend" | "link">(null);

  const resend = useCallback(
    async (invitation: InvitationListItem): Promise<InvitationActionResult> => {
      setBusyKind("resend");
      try {
        const result = await resendInvitationAction(invitation);
        if (result.success) {
          toast.success(result.message ?? "Invitation renvoyée");
        } else {
          toast.error(result.error ?? "Échec du renvoi");
        }
        onSettled?.();
        return result;
      } finally {
        setBusyKind(null);
      }
    },
    [onSettled]
  );

  const ensureMagicLink = useCallback(
    async (invitation: InvitationListItem): Promise<string | null> => {
      setBusyKind("link");
      try {
        const result = await generateMagicLinkAction(invitation);
        if (result.success && result.link) {
          return result.link;
        }
        const err = result as { success: false; error: string };
        toast.error(err.error ?? "Impossible de générer le lien");
        return null;
      } finally {
        setBusyKind(null);
      }
    },
    []
  );

  const copyLink = useCallback(
    async (invitation: InvitationListItem) => {
      const link = await ensureMagicLink(invitation);
      if (!link) {
        onSettled?.();
        return;
      }
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Lien copié dans le presse-papiers");
      } catch {
        toast.message("Lien généré", { description: link, duration: 12000 });
      }
      onSettled?.();
    },
    [ensureMagicLink, onSettled]
  );

  const shareNative = useCallback(
    async (invitation: InvitationListItem) => {
      const link = await ensureMagicLink(invitation);
      if (!link) {
        onSettled?.();
        return;
      }
      const text = "Invitation à rejoindre la classe";
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: "Invitation",
            text: `${text}\n${link}`,
            url: link,
          });
        } else {
          await navigator.clipboard.writeText(link);
          toast.success("Lien copié (partage système non disponible)");
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          // utilisateur a fermé la feuille de partage
        } else {
          toast.error("Partage impossible");
        }
      }
      onSettled?.();
    },
    [ensureMagicLink, onSettled]
  );

  const shareSms = useCallback(
    async (invitation: InvitationListItem) => {
      const link = await ensureMagicLink(invitation);
      if (!link) {
        onSettled?.();
        return;
      }
      const body = encodeURIComponent(`Invitation classe\n${link}`);
      window.open(`sms:?body=${body}`, "_blank", "noopener,noreferrer");
      onSettled?.();
    },
    [ensureMagicLink, onSettled]
  );

  const shareWhatsApp = useCallback(
    async (invitation: InvitationListItem) => {
      const link = await ensureMagicLink(invitation);
      if (!link) {
        onSettled?.();
        return;
      }
      const text = encodeURIComponent(`Invitation classe\n${link}`);
      window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
      onSettled?.();
    },
    [ensureMagicLink, onSettled]
  );

  return {
    resend,
    copyLink,
    shareNative,
    shareSms,
    shareWhatsApp,
    isBusy: busyKind !== null,
    busyKind,
  };
}
