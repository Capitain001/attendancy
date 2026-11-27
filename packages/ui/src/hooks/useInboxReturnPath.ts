// packages/ui/src/hooks/useInboxReturnPath.ts
"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "inbox:return-to";

/** Vérifie que le chemin est une route interne relative (anti open-redirect). */
const isSafePath = (path: string | null): path is string =>
  !!path && path.startsWith("/") && !path.startsWith("//");

/** Vérifie si un chemin pointe vers la boîte de réception pour éviter les boucles de retour. */
export const isInboxPath = (path: string, inboxHref = "/inbox"): boolean =>
  path === inboxHref ||
  path.startsWith(`${inboxHref}/`) ||
  path.startsWith(`${inboxHref}?`) ||
  path.startsWith(`${inboxHref}#`);

/**
 * Mémorise la dernière page visitée hors boîte de réception dans `sessionStorage`
 * et fournit le chemin de retour sécurisé lorsque la boîte de réception est active.
 */
export function useInboxReturnPath(
  pathname: string,
  fallback: string,
  inboxHref = "/inbox",
) {
  const isActive = isInboxPath(pathname, inboxHref);
  const [returnTo, setReturnTo] = useState(fallback);

  const remember = useCallback(() => {
    try {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (isSafePath(current) && !isInboxPath(current, inboxHref)) {
        sessionStorage.setItem(STORAGE_KEY, current);
      }
    } catch {
      /* storage indisponible : on utilisera le fallback */
    }
  }, [inboxHref]);

  useEffect(() => {
    if (!isActive) {
      // Couvre aussi l'entrée vers /inbox via un autre lien (notification, lien direct interne).
      remember();
      return;
    }

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      setReturnTo(
        isSafePath(saved) && !isInboxPath(saved, inboxHref) ? saved : fallback,
      );
    } catch {
      setReturnTo(fallback);
    }
  }, [isActive, pathname, fallback, inboxHref, remember]);

  return { isActive, returnTo, remember };
}
