# `@attendancy/auth`

## Role

Couche d'authentification client partagee entre les applications Vite/Tauri.
Elle gere la session Supabase, expose son etat a React, et transporte les
appels vers les Server Actions accessibles par HTTP.

## Interfaces publiques

`src/index.ts` expose `AuthProvider`/`useAuth`, `useCurrentUser`, les utilitaires
de session (`getSessionState`, `getToken`, `isAuthenticated`), les guards de
routes, le client `api`, `supabase`, les actions login/logout/signup et
`useIsOffline`.

## Session et donnees utilisateur

- `supabase.ts` configure la session persistante dans `localStorage`, le flux
  PKCE et le rafraichissement automatique. Les URL et cles viennent de
  `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
- `AuthProvider` charge l'etat initial et s'abonne aux changements d'auth.
  Quand un utilisateur est connecte, il revendique le cache local avec
  `claimLocalData(userId)`.
- `SessionState` distingue `signed-in`, `offline-stale` et `signed-out`.
  L'etat `offline-stale` permet de rester dans l'application avec le cache
  local quand le renouvellement de session echoue pour cause reseau; il
  n'autorise pas de nouvel appel authentifie.
- `useCurrentUser` utilise une query clee par identifiant utilisateur. La query
  est desactivee sans session valide, ce qui conserve les donnees deja
  persistees en mode hors ligne.
- `requireAuth` et `requireGuest` sont les guards TanStack Router.

## Transport RPC

`api.ts` fournit un proxy dont chaque propriete appelle
`POST ${VITE_API_URL}/api/rpc/<action>`. Il ajoute le Bearer token, rafraichit
la session et rejoue une fois apres un `401`. Une erreur reseau est levee comme
`NetworkError`; une action sans session est refusee, sauf
`signupPersonalDesktopAction`. Les wrappers d'actions correspondants sont
generes dans `@attendancy/rpc`.

`login` revendique le cache avant de finir et tente d'enregistrer l'appareil.
`logout` tente de terminer la session serveur, ferme la session Supabase et
efface les donnees locales. Les echecs d'enregistrement/cloture de session
sont journalises sans interrompre ces flux.

## Dependances et verification

Le package depend de Supabase, `@attendancy/cache`, `@attendancy/rpc` et
`@attendancy/types`; React Query, TanStack Router et React sont des peer
dependencies.

```powershell
bun --filter @attendancy/auth check-types
```

Voir aussi [`rpc-systeme.md`](../../rpc-systeme.md) pour le protocole cote
serveur et le registre d'actions autorisees.
