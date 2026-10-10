cree le pakage cache 

contenu :

packages/cache/
├── package.json
├── tsconfig.json
├── index.ts
├── config.ts
├── client.ts
├── persister.ts
└── clear.ts

respecter la structure src des autre pakage 

fichiers :
packages/cache
packages/cache/
├── package.json
├── tsconfig.json
├── index.ts
├── config.ts
├── client.ts
├── persister.ts
└── clear.ts

package.json :

json
{
  "name": "@attendancy/cache",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts"
  },
  "dependencies": {
    "@attendancy/rpc": "workspace:*"
  }
}

tsconfig.json : 
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["."]
}

config.ts :

ts
// À incrémenter rarement, seulement si la forme des données change de façon incompatible.
// Préfère les changements additifs : une mise à jour de l'app ne doit pas vider le cache.
export const CACHE_SCHEMA_VERSION = "1";

client.ts :

ts
import { QueryClient } from "@tanstack/react-query";
import { NetworkError } from "@attendancy/core";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity, // jamais d'expiration : le cache reste lisible tant que l'utilisateur n'est pas déconnecté
      staleTime: 60_000, // périmé = rafraîchi en arrière-plan quand le réseau est là, l'affichage n'est pas retiré
      retry: (count, error) => !(error instanceof NetworkError) && count < 2,
    },
  },
});

persister.ts :

ts
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

const KEY = "attendancy-query-cache";
const THROTTLE_MS = 1000;

let pending: PersistedClient | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

function cancel() {
  pending = undefined;
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  if (!pending) return;
  const client = pending;
  pending = undefined;
  void set(KEY, client);
}

// Android et iOS suspendent l'app sans prévenir : on écrit dès qu'elle passe en arrière-plan.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flush();
});

// IndexedDB utilise le structured clone : les Date sont conservées telles quelles.
export const queryPersister: Persister = {
  persistClient: async (client) => {
    pending = client;
    timer ??= setTimeout(flush, THROTTLE_MS);
  },
  restoreClient: () => get<PersistedClient>(KEY),
  removeClient: async () => {
    cancel();
    await del(KEY);
  },
};

clear.ts :

ts
import { get, set } from "idb-keyval";
import { queryClient } from "./client";
import { queryPersister } from "./persister";

const OWNER_KEY = "attendancy-cache-owner";

// À appeler au logout
export async function clearLocalData() {
  queryClient.clear();
  await queryPersister.removeClient();
}

// Même utilisateur : le cache est gardé. Autre utilisateur sur le même appareil : on repart de zéro.
export async function claimLocalData(userId: string) {
  const owner = await get<string>(OWNER_KEY);
  if (owner && owner !== userId) await clearLocalData();
  await set(OWNER_KEY, userId);
}

index.ts :

ts
export { queryClient } from "./client";
export { queryPersister } from "./persister";
export { clearLocalData, claimLocalData } from "./clear";
export { CACHE_SCHEMA_VERSION } from "./config";