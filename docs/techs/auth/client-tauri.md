# Authentification Client Vite / Tauri (`apps/teacher` & `@attendancy/auth`)

Ce document détaille le fonctionnement de l'authentification dans les applications clientes séparées du runtime Next.js (illustrées par `apps/teacher`), qui s'appuient sur les packages partagés `@attendancy/auth`, `@attendancy/app`, `@attendancy/cache` et `@attendancy/rpc`.

Pour les détails du transport RPC et des hooks partagés, voir [`../rpc-systeme.md`](../rpc-systeme.md) et [`../hooks-partages.md`](../hooks-partages.md).

---

## 1. Architecture & Packages Impliqués

Les applications Vite / Tauri tournent sur une origine distincte du serveur Next.js (`http://localhost:1420` ou `tauri://localhost` vers `VITE_API_URL`) : elles n'utilisent **jamais de cookies**, mais une session Supabase stockée en `localStorage` et transmise par header `Authorization: Bearer <access_token>` à chaque appel RPC.

| Fichier / Package | Responsabilité |
|---|---|
| [`packages/auth/src/supabase.ts`](../../../packages/auth/src/supabase.ts) | Client `@supabase/supabase-js` (`persistSession: true`, `localStorage`, `storageKey: "attendancy-auth"`, `autoRefreshToken: true`, `flowType: "pkce"`). |
| [`packages/auth/src/session.ts`](../../../packages/auth/src/session.ts) | Machine à états `getSessionState()`, `getToken()`, `isAuthenticated()`. |
| [`packages/auth/src/AuthProvider.tsx`](../../../packages/auth/src/AuthProvider.tsx) | Contexte React `AuthProvider` / `useAuth()`, écoute `onAuthStateChange` et déclenche `claimLocalData(userId)`. |
| [`packages/auth/src/guards.ts`](../../../packages/auth/src/guards.ts) | Guards TanStack Router `requireAuth` et `requireGuest`. |
| [`packages/auth/src/api.ts`](../../../packages/auth/src/api.ts) | Proxy RPC `api` : injecte le Bearer token, gère le retry `401` avec `refreshSession()`, reconvertit les dates ISO et lève `NetworkError` hors-ligne. |
| [`packages/auth/src/useCurrentUser.ts`](../../../packages/auth/src/useCurrentUser.ts) | Hook React Query `["currentUser", userId]` appelant `api.getCurrentUserAction()` + indicateur `isOffline`. |
| [`packages/auth/src/actions/`](../../../packages/auth/src/actions/index.ts) | Actions clientes `login`, `logout`, `signupPersonal` et gestion du `deviceId` (`device-id.ts`). |
| [`packages/cache/src/clear.ts`](../../../packages/cache/src/clear.ts) | Isolation du cache IndexedDB par utilisateur (`claimLocalData`, `clearLocalData`, `getCacheOwner`). |
| [`packages/app/src/AppRouter.tsx`](../../../packages/app/src/AppRouter.tsx) | Assemble `<AuthProvider>`, `<PersistQueryClientProvider>` et `<RouterProvider>` avec invalidation automatique du routeur. |

---

## 2. Machine à États de Session & Mode Hors-Ligne (`session.ts`)

`getSessionState()` résout la session en l'un des **3 états** suivants :

```typescript
export type SessionState =
  | { status: "signed-in"; session: Session }
  | { status: "offline-stale"; userId: string | null }
  | { status: "signed-out" };
```

1. **`signed-in`** : `supabase.auth.getSession()` retourne une session valide. `AuthProvider` appelle `claimLocalData(session.user.id)` pour associer le cache IndexedDB à cet utilisateur.
2. **`offline-stale`** : aucune session active n'est disponible car le renouvellement du token a échoué à cause d'une erreur réseau (`isAuthRetryableFetchError(error)`).
   - Au lieu de déconnecter l'utilisateur, `getSessionState()` récupère l'identifiant du dernier propriétaire du cache local (`getCacheOwner()` dans IndexedDB).
   - `isAuthenticated(state)` retourne **`true`** pour `signed-in` **et** pour `offline-stale`, ce qui permet à l'enseignant de consulter son planning en lecture seule sans réseau.
3. **`signed-out`** : aucune session et aucune erreur réseau (utilisateur jamais connecté ou explicitement déconnecté).

---

## 3. Isolation du Cache Local Multi-Utilisateurs (`@attendancy/cache`)

Fichier : [`packages/cache/src/clear.ts`](../../../packages/cache/src/clear.ts)

Pour éviter qu'un utilisateur B se connectant sur le même appareil ne voie les données en cache d'un utilisateur A :
- **`claimLocalData(userId)`** (appelée dès le `login()` avant la navigation, et par `AuthProvider` à l'état `signed-in`) : compare `userId` à la clé IndexedDB `attendancy-cache-owner`. Si le propriétaire précédent est différent (`owner && owner !== userId`), vide intégralement le `queryClient` en mémoire et le persister IndexedDB (`clearLocalData()`) avant d'enregistrer le nouveau `userId`.
- **`clearLocalData()`** (appelée au `logout()`) : vide le `queryClient` et supprime le cache persisté IndexedDB.

---

## 4. Lecture du Profil (`useCurrentUser`) & Détection Offline

Fichier : [`packages/auth/src/useCurrentUser.ts`](../../../packages/auth/src/useCurrentUser.ts)

- Utilise la clé React Query `["currentUser", userId]` (où `userId` provient de `auth.session.user.id` en mode `signed-in`, ou de `auth.userId` en mode `offline-stale`).
- Appelle `api.getCurrentUserAction()` (Server Action dans [`apps/web/src/modules/auth/rpc/actions.ts`](../../../apps/web/src/modules/auth/rpc/actions.ts) qui exécute `getUserInfo()` puis `mapUserRpc(user)`).
- La requête réseau n'est activée que si `isSignedIn && !!userId` : en mode `offline-stale`, aucun appel réseau n'est tenté et React Query restitue directement le `UserInfo` persisté dans IndexedDB.
- Expose `isOffline = isSessionStale || query.isPaused || query.isRefetchError` (affiché dans le `<Header />` de `RootLayout`).

---

## 5. Actions d'Authentification Clientes (`packages/auth/src/actions/`)

### `login({ email, password })` ([`login.ts`](../../../packages/auth/src/actions/login.ts))
1. Supprime les éventuelles requêtes `["me"]` résiduelles.
2. Appelle `supabase.auth.signInWithPassword({ email, password })`.
3. Appelle immédiatement `await claimLocalData(data.user.id)` avant l'affichage du premier écran.
4. Enregistre l'appareil en best-effort via `api.registerDeviceAction({ deviceId: getDeviceId() })` (UUID généré et stocké sous `localStorage["attendancy-device-id"]`).

### `signupPersonal(email, password)` ([`signup.ts`](../../../packages/auth/src/actions/signup.ts))
- Délègue toute la création de compte au serveur via `api.signupPersonalDesktopAction({ email, password })`.
- `signupPersonalDesktopAction` est la seule action inscrite dans `PUBLIC_ACTIONS` (dans [`packages/auth/src/api.ts`](../../../packages/auth/src/api.ts) et [`apps/web/src/app/api/rpc/[action]/route.ts`](../../../apps/web/src/app/api/rpc/[action]/route.ts)) autorisée sans token Bearer.

### `logout()` ([`logout.ts`](../../../packages/auth/src/actions/logout.ts))
1. Clôture la session d'appareil côté serveur en best-effort via `api.endSessionAction({ deviceId: getDeviceId() })`.
2. Appelle `supabase.auth.signOut()`.
3. Vide le cache local via `await clearLocalData()`.

---

## 6. Routing & Guards dans `apps/teacher`

```text
apps/teacher/src/main.tsx
  └─ <AppRouter router={router} />                (@attendancy/app)
       ├─ Tant que auth === null                  → <AuthLoading />
       └─ Dès que auth est résolu                 → <RouterProvider context={{ auth: { ...auth, isAuthenticated } }} />
            ├─ "/" (routes/index.tsx)             → redirect vers "/home" si isAuthenticated, sinon "/auth/login"
            ├─ "/_app" (routes/_app/route.tsx)    → beforeLoad: requireAuth  (protège /home, /sessions)
            └─ "/auth" (routes/auth/route.tsx)    → beforeLoad: requireGuest (protège /auth/login, /auth/signup/personal)
```

Lorsque l'état `isAuthenticated` bascule (suite à un `login`, un `logout` ou une expiration de session), `RouterWithAuth` appelle automatiquement `router.invalidate()`, ce qui ré-exécute les hooks `beforeLoad` (`requireAuth` / `requireGuest`) et redirige l'utilisateur sans rechargement de page.

