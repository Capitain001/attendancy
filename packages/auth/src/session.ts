import {
  isAuthRetryableFetchError,
  type Session,
} from "@supabase/supabase-js";
import { getCacheOwner } from "@attendancy/cache";
import { supabase } from "./supabase";

export type SessionState =
  | { status: "signed-in"; session: Session }
  // Connecté localement, mais le renouvellement du token a échoué faute de réseau.
  // Il n'y a plus de session exploitable, donc plus d'identifiant côté Supabase :
  // userId vient du cache local (dernier utilisateur connecté sur cet appareil),
  // pour retrouver ses données en cache. null si le cache n'a pas de propriétaire.
  | { status: "offline-stale"; userId: string | null }
  | { status: "signed-out" };

// Lecture d'IndexedDB : en cas d'échec, on renvoie null plutôt que de faire
// échouer getSessionState (l'app resterait bloquée sur l'écran de chargement).
async function readCacheOwner(): Promise<string | null> {
  try {
    return (await getCacheOwner()) ?? null;
  } catch {
    return null;
  }
}

export async function getSessionState(): Promise<SessionState> {
  const { data, error } = await supabase.auth.getSession();
  if (data.session) return { status: "signed-in", session: data.session };

  // Pas de session + erreur réseau : on ne sait pas si l'utilisateur est encore
  // valide, on le laisse dans l'app avec son cache (lecture seule de fait).
  if (error && isAuthRetryableFetchError(error)) {
    return { status: "offline-stale", userId: await readCacheOwner() };
  }

  // Pas de session et pas d'erreur réseau : jamais connecté, ou déconnecté.
  return { status: "signed-out" };
}

export async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// null = chargement. Remplace les comparaisons répétées de l'ancien router.
export function isAuthenticated(state: SessionState | null | undefined): boolean {
  return state?.status === "signed-in" || state?.status === "offline-stale";
}