import { useQuery } from "@tanstack/react-query";
import type { UserInfo } from "@attendancy/types";
import { useAuth } from "./AuthProvider";
import { api } from "./api";

export function useCurrentUser() {
  const auth = useAuth();
  const isSignedIn = auth?.status === "signed-in";

  // La session n'a pas pu être renouvelée faute de réseau (statut d'auth offline-stale).
  // Détail interne : n'est qu'une des causes de isOffline plus bas.
  const isSessionStale = auth?.status === "offline-stale";

  // Connecté : l'identifiant vient de la session Supabase.
  // Session périmée : pas de session, on prend celui du dernier utilisateur du cache
  // (résolu une seule fois dans getSessionState, donc sans lecture ni rendu en plus ici).
  const userId = isSignedIn
    ? auth.session.user.id
    : isSessionStale
      ? auth.userId
      : null;

  const query = useQuery({
    // L'identifiant dans la clé garantit qu'on ne lit jamais les données d'un autre
    // utilisateur. Hors ligne, c'est la même clé qu'avant la perte de session,
    // donc les données persistées sont retrouvées.
    queryKey: ["currentUser", userId],
    queryFn: async (): Promise<UserInfo | null> => {
      const res = await api.getCurrentUserAction();
      if ("error" in res && res.error) {
        throw new Error(res.error);
      }
      return (res.data as UserInfo) ?? null;
    },
    // Aucun appel sans token valide : avec une session périmée la requête est
    // désactivée, mais elle renvoie quand même les données déjà présentes dans le cache.
    enabled: isSignedIn && !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    ...query,
    // true quand les données affichées ne sont peut-être pas à jour, pour inviter
    // l'utilisateur à vérifier sa connexion. Trois causes possibles :
    // - la session n'a pas pu être renouvelée (isSessionStale) ;
    // - le rafraîchissement est en pause parce que l'appareil est hors ligne (isPaused) ;
    // - le rafraîchissement a échoué, par exemple serveur injoignable (isRefetchError).
    // Une donnée encore fraîche (moins de 5 min) ne déclenche pas ce signal, puisqu'elle
    // n'a pas besoin d'être rafraîchie.
    isOffline: isSessionStale || query.isPaused || query.isRefetchError,
  };
}