// src/cache/client/engine.ts
// Moteur générique de clés de cache React Query — durées, presets, fabriques
// de clés. AUCUNE référence métier ici : copiable tel quel d'un projet à
// l'autre. Le registre métier (CACHE_KEYS) vit dans ./keys.

export const CACHE_TIME = {
  VERY_SHORT: 15 * 1000, // 15 sec  (temps réel)
  SHORT: 60 * 1000, // 1 min       (UI dynamique)
  MEDIUM: 5 * 60 * 1000, // 5 min  (dashboard)
  LONG: 30 * 60 * 1000, // 30 min  (quasi statique)
  VERY_LONG: 60 * 60 * 1000, // 1h (référentiel stable)
} as const;

export const QUERY_PRESETS = {
  LIVE: {
    staleTime: CACHE_TIME.VERY_SHORT,
    refetchInterval: CACHE_TIME.VERY_SHORT,
  },
  SESSION: {
    staleTime: CACHE_TIME.SHORT,
    refetchInterval: CACHE_TIME.SHORT,
  },
  DASHBOARD: {
    staleTime: CACHE_TIME.MEDIUM,
  },
  STATIC: {
    staleTime: CACHE_TIME.LONG,
  },
} as const;

/**
 * Fabrique pour le cas standard "collection + détail par id".
 *   entityKeys("examples").ALL          → ["examples"]
 *   entityKeys("examples").byId("42")   → ["examples", "42"]
 * Couvre les entités qui n'ont que ces deux besoins ; une entité avec des
 * variantes propres (filtres, sous-ressources) étend le résultat à la main
 * dans le registre métier (voir ./keys.ts).
 */
export function entityKeys<const N extends string>(name: N) {
  const ALL = [name] as const;
  return {
    ALL,
    byId: (id: string) => [...ALL, id] as const,
  };
}

/**
 * Fabrique pour le cas "sous-collection nommée + un ou plusieurs ids".
 *   subKey("examples", "by-parent")("p1")        → ["examples", "by-parent", "p1"]
 *   subKey("examples", "eligible")("p1", "e1")    → ["examples", "eligible", "p1", "e1"]
 */
export function subKey<const E extends string, const S extends string>(
  entity: E,
  sub: S
) {
  return (...ids: string[]) => [entity, sub, ...ids] as const;
}
