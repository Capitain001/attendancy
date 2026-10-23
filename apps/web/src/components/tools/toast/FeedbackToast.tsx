"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "@/lib/toast/custom-toast";

type FeedbackToastProps = { error?: string; status?: string };

// Affiche les messages de feedback (déjà résolus côté serveur par getFeedback)
// puis retire les paramètres de l'URL pour qu'un rafraîchissement ne rejoue pas le toast.
export function FeedbackToast({ error, status }: FeedbackToastProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!error && !status) return;

    if (error) toast.error(error, "feedback-error");
    if (status) toast.success(status, "feedback-status");

    router.replace(pathname, { scroll: false });
  }, [error, status, pathname, router]);

  return null;
}