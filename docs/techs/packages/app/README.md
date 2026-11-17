# `@attendancy/app`

## Role

Shell React commun aux applications clientes. Il assemble l'authentification,
React Query persiste et le layout partage, sans definir le route tree d'une
application.

## Entree et composants

- `src/index.ts` expose `AppRouter`, `RootLayout`, `baseRouterOptions` et le
  type `RouterContext`.
- `AppRouter` installe `AuthProvider` et `PersistQueryClientProvider`, fournit
  le client et le persister de `@attendancy/cache`, puis injecte l'etat auth au
  `RouterProvider`.
- Un changement d'etat authentifie/non authentifie appelle
  `router.invalidate()` pour rejouer les `beforeLoad`.
- `RootLayout` assemble `NuqsAdapter`, `AppProvider`, `MainLayout` et `Header`.
  Le header recoit l'utilisateur, l'etat hors ligne et le callback `logout`.
- `AuthLoading` presente l'etat de chargement initial.

## Contrats et dependances

- Le routeur est fourni par l'appelant en tant que `AnyRouter` TanStack Router.
- `baseRouterOptions` utilise `createHashHistory`, requis par le routage dans
  Tauri, et reserve le contexte `auth` a `AppRouter`.
- TanStack Router, React, React Query, son persister et `nuqs` sont des
  peerDependencies. Les applications hote fournissent leurs versions runtime.
- `@attendancy/auth`, `@attendancy/cache` et `@attendancy/ui` sont des
  dependances workspace.

## Utilisation

L'application hote construit son routeur et le passe a `AppRouter`, puis utilise
`RootLayout` dans sa route racine. Le package fournit le cadre commun; les
routes et leurs `beforeLoad` restent dans l'application hote.

## Verification

```powershell
bun --filter @attendancy/app check-types
```
