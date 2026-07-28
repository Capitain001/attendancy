# store/ — stores Zustand

Un fichier par store, suffixe `Store.ts`. Pattern de référence : `userStore.ts`.

## Règle de décision — où vit un état ?

| Besoin | Solution | Pas un store |
|---|---|---|
| Donnée serveur affichée | RSC (page) ou React Query (`hooks/data/`) | ✗ |
| Donnée serveur + mutations client | `useCrudEntity` (React Query) | ✗ |
| État UI local à un composant | `useState` / `useReducer` | ✗ |
| État client PARTAGÉ entre arbres éloignés (user courant, préférences, presence) | **store Zustand** | ✓ |

Un store ne duplique JAMAIS une donnée déjà gérée par React Query — deux caches
sur la même donnée = désynchronisation garantie (même règle que côté serveur,
voir `src/services/SERVICE_CONTEXT.md` §7).

## Conventions

- `'use client'` en tête — un store n'est jamais importé côté serveur.
- `persist` + `createJSONStorage` uniquement si la donnée doit survivre au
  rechargement (sinon store simple).
- Toujours exposer un `clear()` — appelé au logout.
- Types depuis les services (`@/services/user/types`) — jamais redéfinis ici.
