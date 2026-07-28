// src/services/org/cache.ts
// Graphe d'invalidation du service org : événement métier → tags à invalider.
// Enregistré dans src/cache/server/key.ts (spread dans CACHE_GRAPH).
//
// Cross-service : si une query d'un AUTRE service inclut des données org dans
// son select, ajouter son tag ici (l'événement org invalide aussi ce cache).
import { CACHE } from '@/cache/server/key'

export const ORG_GRAPH = {
  ORG_CREATED: (orgId: string) => [
    CACHE.ORG(orgId),
  ],
  ORG_UPDATED: (orgId: string) => [
    CACHE.ORG(orgId),
  ],
} as const
