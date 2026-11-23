// packages/auth/src/useAuthUser.ts
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mapClientUser, mapUserInfo, type ClientUser } from "@attendancy/user";
import { useAuth } from "./AuthProvider";
import { AUTH_CACHE_KEYS } from "./cache";

/**
 * Utilisateur courant, dérivé de la session locale : aucun appel réseau, disponible dès le
 * premier rendu après la connexion. Seule source de l'identité côté client.
 * Pour affichage uniquement : le client ne s'en sert jamais pour autoriser une action.
 * Les données de la table User (adresse, date de naissance...) ne sont pas dans la session :
 * elles relèvent d'une action dédiée, pas de ce hook.
 */
export function useAuthUser(): ClientUser | null {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const supabaseUser = auth?.status === "signed-in" ? auth.session.user : null;
  const staleUserId = auth?.status === "offline-stale" ? auth.userId : null;

  const mapped = useMemo(
    () => (supabaseUser ? mapClientUser(mapUserInfo({ user: supabaseUser })) : null),
    [supabaseUser],
  );

  // Stable PAR VALEUR : getSessionState est rappelé à chaque événement d'auth (rafraîchissement
  // du jeton, SIGNED_IN rejoué au retour d'onglet) et renouvelle `session` sans changer
  // l'utilisateur. On compare le contenu (clés dans un ordre fixe, garanti par mapClientUser) et
  // non updated_at, dont rien ne prouve qu'il change quand app_metadata est modifié côté serveur.
  const valueKey = mapped ? JSON.stringify(mapped) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sessionUser = useMemo(() => mapped, [valueKey]);

  // Instantané du dernier utilisateur connu, écrit dans le cache persisté : en session
  // périmée (hors ligne, sans session) c'est la seule source du nom et de l'avatar.
  useEffect(() => {
    if (sessionUser) {
      queryClient.setQueryData(
        AUTH_CACHE_KEYS.CURRENT_USER(sessionUser.id),
        sessionUser,
      );
    }
  }, [queryClient, sessionUser]);

  // Lecture de l'instantané sans observateur : le cache peut être restauré après le premier
  // rendu, la lecture réagit à cette restauration.
  const subscribe = useCallback(
    (onChange: () => void) =>
      queryClient.getQueryCache().subscribe(() => onChange()),
    [queryClient],
  );
  const snapshot = useSyncExternalStore(subscribe, () =>
    staleUserId
      ? queryClient.getQueryData<ClientUser>(
          AUTH_CACHE_KEYS.CURRENT_USER(staleUserId),
        )
      : undefined,
  );

  if (sessionUser) return sessionUser;
  if (staleUserId) return snapshot ?? { id: staleUserId };
  return null;
}
