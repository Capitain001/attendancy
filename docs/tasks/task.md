

apiUser ?? authUser : son en realiter les meme issus de la meme source ( session supabase ) donc on retire useCurrentUser du pakage auth 

La seule vraie dépendance qui disparaissait avec le hook était le repli hors ligne : en session périmée, useAuthUser relisait le dernier utilisateur dans le cache de useCurrentUser. Sans ce hook, c'est useAuthUser lui-même qui écrit cet instantané dans le cache persisté

## Les fichiers

```typescript
// packages/auth/src/useAuthUser.ts
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mapUserInfo, mapUserRpc, type RpcUser } from "@attendancy/user";
import { useAuth } from "./AuthProvider";
import { AUTH_CACHE_KEYS } from "./cache";

/**
 * Utilisateur courant, dérivé de la session locale : aucun appel réseau, disponible dès le
 * premier rendu après la connexion. Seule source de l'identité côté client.
 * Pour affichage uniquement : le client ne s'en sert jamais pour autoriser une action.
 * Les données de la table User (adresse, date de naissance...) ne sont pas dans la session :
 * elles relèvent d'une action dédiée, pas de ce hook.
 */
export function useAuthUser(): RpcUser | null {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const supabaseUser = auth?.status === "signed-in" ? auth.session.user : null;
  const staleUserId = auth?.status === "offline-stale" ? auth.userId : null;

  const mapped = useMemo(
    () => (supabaseUser ? mapUserRpc(mapUserInfo({ user: supabaseUser })) : null),
    [supabaseUser],
  );

  // Stable PAR VALEUR : getSessionState est rappelé à chaque événement d'auth (rafraîchissement
  // du jeton, SIGNED_IN rejoué au retour d'onglet) et renouvelle `session` sans changer
  // l'utilisateur. On compare le contenu (clés dans un ordre fixe, garanti par mapUserRpc) et
  // non updated_at, dont rien ne prouve qu'il change quand app_metadata est modifié côté serveur.
  const valueKey = mapped ? JSON.stringify(mapped) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sessionUser = useMemo(() => mapped, [valueKey]);

  // Instantané du dernier utilisateur connu, écrit dans le cache persisté : en session
  // périmée (hors ligne, sans session) c'est la seule source du nom et de l'avatar.
  useEffect(() => {
    if (sessionUser) {
      queryClient.setQueryData(AUTH_CACHE_KEYS.CURRENT_USER(sessionUser.id), sessionUser);
    }
  }, [queryClient, sessionUser]);

  // Lecture de l'instantané sans observateur : le cache peut être restauré après le premier
  // rendu, la lecture réagit à cette restauration.
  const subscribe = useCallback(
    (onChange: () => void) => queryClient.getQueryCache().subscribe(() => onChange()),
    [queryClient],
  );
  const snapshot = useSyncExternalStore(subscribe, () =>
    staleUserId
      ? queryClient.getQueryData<RpcUser>(AUTH_CACHE_KEYS.CURRENT_USER(staleUserId))
      : undefined,
  );

  if (sessionUser) return sessionUser;
  if (staleUserId) return snapshot ?? { id: staleUserId };
  return null;
}
```

```typescript
// packages/auth/src/cache.ts
// Clés du cache React Query propres au package auth.

// Définie une seule fois : la clé complète et la racine ne peuvent pas diverger.
const CURRENT_USER_ROOT = ["currentUser"] as const;

export const AUTH_CACHE_KEYS = {
  // Racine : sert aux suppressions par préfixe (removeQueries), jamais à lire une donnée.
  CURRENT_USER_ROOT,
  // Instantané du dernier utilisateur connu : écrit par useAuthUser à partir de la session
  // (aucune requête réseau), persisté pour être relu hors ligne.
  CURRENT_USER: (userId: string | null) => [...CURRENT_USER_ROOT, userId] as const,
} as const;
```

```tsx
//packages\app\src\RootLayout.tsx
import { Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { AppProvider, MainLayout, Header } from "@attendancy/ui";
import { useAuthUser, useIsOffline, logout } from "@attendancy/auth";

export function RootLayout() {
  // Session locale : immédiate, sans réseau. L'en-tête a toujours un utilisateur (donc le
  // menu et le bouton de déconnexion), même serveur éteint ou hors ligne.
  const user = useAuthUser();
  const isOffline = useIsOffline();

  return (
    <NuqsAdapter>
      <AppProvider>
        <MainLayout
          header={
            <Header
              user={user ?? undefined}
              onSignOut={logout}
              isOffline={isOffline}
            />
          }
        >
          <Outlet />
        </MainLayout>
      </AppProvider>
    </NuqsAdapter>
  );
}
```

```typescript
//packages\auth\src\hooks\useIsOffline.ts
import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";
import { useAuth } from "../AuthProvider";

// onlineManager est un store externe : useSyncExternalStore re-rend le composant
// à chaque changement, sans useEffect ni useState.
const subscribe = (onChange: () => void) =>
  onlineManager.subscribe(() => onChange());
const getSnapshot = () => onlineManager.isOnline();

export function useIsOffline() {
  // L'appareil n'a pas de connexion réseau (navigator.onLine).
  const isDeviceOffline = !useSyncExternalStore(subscribe, getSnapshot);

  // L'appareil se croit en ligne, mais le renouvellement de session a échoué
  // faute de réseau (Wi-Fi sans internet, serveur injoignable). Aucune requête
  // n'est lancée pour l'utilisateur courant : cette ligne est le seul signal.
  const isSessionStale = useAuth()?.status === "offline-stale";

  return isDeviceOffline || isSessionStale;
}
```

```typescript
//packages\auth\src\index.ts
export { AuthProvider, useAuth } from "./AuthProvider";
export { useAuthUser } from "./useAuthUser";
export {
  getSessionState,
  getToken,
  isAuthenticated,
  type SessionState,
} from "./session";
export { requireAuth, requireGuest, type AuthRouterContext } from "./guards";
export { supabase } from "./supabase";
export { api } from "./api";
export { login, logout, signupPersonal } from "./actions";

export { useIsOffline } from "./hooks";
export { AUTH_CACHE_KEYS } from "./cache";
```

**À supprimer :**
- `packages/auth/src/useCurrentUser.ts` ;
- l'entrée `getCurrentUserAction` dans `api` ;
- côté web, `getCurrentUserAction` dans `modules/auth/rpc/actions.ts` (et le dossier `modules/auth/rpc/` si rien d'autre n'y vit). `mapUserRpc` n'a plus d'appelant serveur : il reste dans `@attendancy/user`, où `useAuthUser` l'utilise.

`login.ts` et `logout.ts` ne changent pas : leur `removeQueries` sur la racine efface maintenant l'instantané de l'utilisateur précédent.

## Ce que ça change

- **Le signal « serveur injoignable » disparaît de `isOffline`.** Il venait de l'échec de la requête `currentUser`. Avec l'utilisateur tiré de la session, il n'y a plus de données à signaler comme douteuses. Si un indicateur de connexion au serveur reste utile, c'est l'état de la connexion temps réel (`isConnected`), pas l'identité.
- **Quand le serveur modifie les droits de l'utilisateur** (changement d'organisation, acceptation d'invitation, tout `setUserAccess`), le client doit appeler `supabase.auth.refreshSession()` pour recevoir les nouveaux claims. L'événement d'auth fait ensuite le reste : `useAuthUser` détecte le changement par valeur. Il n'y a plus de refetch à invalider.
- **`RpcUser` et `RPC_USER_KEYS` ne sont plus « RPC »** : le serveur n'envoie plus rien, ils décrivent ce que les composants lisent. Je les laisserais en l'état pour l'instant, et un renommage (par exemple `ClientUser`) peut venir plus tard.

## À vérifier


- **Les autres usages de `useCurrentUser`.** `git grep -n "useCurrentUser"` : ceux qui n'affichaient que l'identité passent à `useAuthUser`, et `tsc` signalera les autres.



Le renommage

 mapClientUser, et pour rester cohérent  le reste du contrat avec lui : RpcUser devient ClientUser et RPC_USER_KEYS devient CLIENT_USER_KEYS. Il n'y a plus de RPC dans ce chemin, donc un vocabulaire « rpc » dans le contrat serait un faux ami. 
 
 Le dossier modules/auth/rpc/ côté web part avec getCurrentUserAction. reste pour un usage future possible mais il n est plus exposer dans le contract 