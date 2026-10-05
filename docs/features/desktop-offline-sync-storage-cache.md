Voici l'ensemble, avec les corrections (aucune expiration, `buster` fixe, propriétaire du cache). J'ai aussi déplacé `NetworkError` dans son propre fichier : sans ça, `auth.ts` → `local-data.ts` → `query-client.ts` → `api.ts` → `auth.ts` formait un import circulaire.

## Dépendances

```bash
pnpm --filter desktop add @tanstack/react-query-persist-client idb-keyval
```

## Fichiers nouveaux

```typescript
// apps/desktop/src/lib/network-error.ts
export class NetworkError extends Error {}
```

```typescript
// apps/desktop/src/lib/cache-config.ts
// À incrémenter rarement, seulement si la forme des données change de façon incompatible.
// Préfère les changements additifs : une mise à jour de l'app ne doit pas vider le cache.
export const CACHE_SCHEMA_VERSION = '1'
```

```typescript
// apps/desktop/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'
import { NetworkError } from './network-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity, // jamais d'expiration : le cache reste lisible tant que l'utilisateur n'est pas déconnecté
      staleTime: 60_000, // périmé = rafraîchi en arrière-plan quand le réseau est là, l'affichage n'est pas retiré
      retry: (count, error) => !(error instanceof NetworkError) && count < 2,
    },
  },
})
```

```typescript
// apps/desktop/src/lib/query-persister.ts
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'

const KEY = 'attendancy-query-cache'
const THROTTLE_MS = 1000

let pending: PersistedClient | undefined
let timer: ReturnType<typeof setTimeout> | undefined

function cancel() {
  pending = undefined
  if (timer) { clearTimeout(timer); timer = undefined }
}

function flush() {
  if (timer) { clearTimeout(timer); timer = undefined }
  if (!pending) return
  const client = pending
  pending = undefined
  void set(KEY, client)
}

// Android et iOS suspendent l'app sans prévenir : on écrit dès qu'elle passe en arrière-plan.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush()
})

// IndexedDB utilise le structured clone : les Date sont conservées telles quelles.
export const queryPersister: Persister = {
  persistClient: async (client) => {
    pending = client
    timer ??= setTimeout(flush, THROTTLE_MS)
  },
  restoreClient: () => get<PersistedClient>(KEY),
  removeClient: async () => {
    cancel()
    await del(KEY)
  },
}
```

```typescript
// apps/desktop/src/lib/local-data.ts
import { get, set } from 'idb-keyval'
import { queryClient } from './query-client'
import { queryPersister } from './query-persister'

const OWNER_KEY = 'attendancy-cache-owner'

export async function clearLocalData() {
  queryClient.clear()
  await queryPersister.removeClient()
}

// Même utilisateur : le cache est gardé. Autre utilisateur sur le même appareil : on repart de zéro.
export async function claimLocalData(userId: string) {
  const owner = await get<string>(OWNER_KEY)
  if (owner && owner !== userId) await clearLocalData()
  await set(OWNER_KEY, userId)
}
```

## Fichiers modifiés

```tsx
// apps/desktop/src/providers/react-query-provider.tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { queryClient } from '../lib/query-client'
import { queryPersister } from '../lib/query-persister'
import { CACHE_SCHEMA_VERSION } from '../lib/cache-config'

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: Infinity,
        buster: CACHE_SCHEMA_VERSION,
      }}
    >
      {children}
      <ReactQueryDevtools buttonPosition="top-left" initialIsOpen={false} />
    </PersistQueryClientProvider>
  )
}
```

```typescript
// apps/desktop/src/lib/api.ts : remplacer la déclaration de NetworkError
import { NetworkError } from './network-error'
export { NetworkError }
// ...le reste du fichier est inchangé : send() lève toujours NetworkError
```

```typescript
// apps/desktop/src/lib/auth.ts : login et logout
import { clearLocalData, claimLocalData } from './local-data'

export async function login(email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return 'Email ou mot de passe incorrect'
  // avant le premier écran : un autre utilisateur ne voit jamais le cache du précédent
  await claimLocalData(data.user.id)
  return null
}

export async function logout() {
  await supabase.auth.signOut()
  await clearLocalData()
}
```

```typescript
// apps/desktop/src/hooks/useAuth.ts : ajouter cet effet dans useAuth, après le premier
useEffect(() => {
  if (state?.status === 'signed-in') void claimLocalData(state.session.user.id)
}, [state])
```

Ajoute `import { claimLocalData } from '../lib/local-data'` en haut du fichier.

## À brancher ailleurs

- **Changement d'organisation active** : appelle `clearLocalData()` juste après le changement, sinon l'organisation précédente reste affichée sous les mêmes clés.
- **Porte d'entrée de l'app** : affiche l'application pour `signed-in` et `offline-stale`, et ne renvoie à la connexion que pour `signed-out`.
- **Supprimer** : `__APP_VERSION__` dans `vite.config.ts` et `vite-env.d.ts`, si tu l'avais déjà ajouté.

## Vérification

1. Ouvre quelques écrans en ligne, coupe le réseau, ferme puis relance l'app : les données s'affichent.
2. Rétablis le réseau : les données se mettent à jour sans recharger.
3. Coupe le réseau, laisse le token expirer, relance : l'app reste accessible (`offline-stale`).
4. Connecte un autre compte : l'ancien cache a disparu. Après `logout`, la clé `attendancy-query-cache` n'existe plus dans IndexedDB.