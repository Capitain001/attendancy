# `@attendancy/cache`

## Role

Fournit aux clients le singleton React Query, sa persistance IndexedDB et les
operations de cloisonnement du cache entre utilisateurs.

## API

- `queryClient` : `QueryClient` partage, `gcTime` infini, `staleTime` d'une
  minute et au plus deux nouvelles tentatives, sauf pour `NetworkError`.
- `queryPersister` : persiste le client React Query dans IndexedDB via
  `idb-keyval`. Les ecritures sont regroupees sur une seconde et forcees lorsque
  le document passe en arriere-plan.
- `clearLocalData()` vide le client en memoire et retire le cache persiste.
- `claimLocalData(userId)` conserve les donnees si le proprietaire reste le
  meme; sinon, il efface le cache avant d'enregistrer le nouvel utilisateur.
- `getCacheOwner()` lit l'identifiant proprietaire.
- `CACHE_SCHEMA_VERSION` est le `buster` utilise par
  `PersistQueryClientProvider`; il doit changer lors d'une incompatibilite de
  forme du cache persiste.

## Cycle de vie et invariants

`@attendancy/app` fournit `queryClient`, `queryPersister` et le buster au
`PersistQueryClientProvider`. `@attendancy/auth` revendique le cache au login
ou au chargement d'une session et le vide au logout. Cette coordination evite
qu'un utilisateur reutilise le cache d'un autre sur le meme appareil.

`client.ts` lit `navigator.onLine` au chargement. Le package est donc destine
aux runtimes navigateur/Tauri, pas a une execution serveur sans `navigator`.
Ne pas ajouter les donnees d'un nouvel utilisateur a un cache local avant
`claimLocalData`.

## Dependances et verification

Depend de React Query, du persister React Query, `idb-keyval` et
`@attendancy/rpc` (pour reconnaitre `NetworkError`).

```powershell
bun --filter @attendancy/cache check-types
```
