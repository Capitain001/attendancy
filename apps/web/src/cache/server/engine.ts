// src/cache/server/engine.ts
// Moteur de cache générique — pattern clé/tag scopé + invalidation Next 16
// ("use cache" + cacheTag()/cacheLife() en lecture, updateTag() en écriture).
//
// AUCUNE référence métier ici : ce fichier ne connaît ni le nom du projet ni
// aucune donnée applicative — il est copiable tel quel d'un projet à l'autre.
// Le registre métier (CACHE, CACHE_GRAPH) vit dans ./keys.
import { updateTag } from "next/cache";

/** Profils cacheLife (next.config custom ou profils intégrés Next). */
export const CACHE_LIFE = {
  SHORT: "seconds",
  MEDIUM: "minutes",
  LONG: "hours",
  MAX: "max",
} as const;

export type CacheLifeProfile = (typeof CACHE_LIFE)[keyof typeof CACHE_LIFE];

/** Une entrée de registre : génère la clé/tag, porte son profil cacheLife. */
export type CacheKeyFn<L extends CacheLifeProfile = CacheLifeProfile> = {
  (scopeId?: string, id?: string): string;
  life: L;
};

/**
 * Générateur de clé/tag scopé — générique, aucune notion métier.
 *   key("examples")(scopeId)        → "examples:<scopeId>"
 *   key("examples")(scopeId, id)    → "examples:<scopeId>:<id>"
 *   key("catalog")()                → "catalog"                    (global)
 * `scopeId` = l'identifiant qui isole les données entre tenants/organisations
 * dans le projet courant (orgId, schoolId, workspaceId…) — ce fichier reste
 * agnostique dessus.
 */
export function key<L extends CacheLifeProfile = typeof CACHE_LIFE.MEDIUM>(
  name: string,
  life: L = CACHE_LIFE.MEDIUM as L
): CacheKeyFn<L> {
  return Object.assign(
    (scopeId?: string, id?: string) => {
      if (scopeId && id) return `${name}:${scopeId}:${id}`;
      if (scopeId) return `${name}:${scopeId}`;
      return name;
    },
    { life }
  );
}

/**
 * Construit `invalidateCache`/`invalidateEvent` liés à UN registre (CACHE) et
 * UN graphe d'événements (CACHE_GRAPH) donnés en paramètre. Le moteur ignore
 * totalement leur contenu — il ne fait qu'appeler `updateTag` en silencieux.
 *
 * @example
 * // dans keys.ts (métier) :
 * export const { invalidateCache, invalidateEvent } =
 *   createInvalidators(CACHE, CACHE_GRAPH);
 */
export function createInvalidators<
  C extends Record<string, (scopeId?: string, id?: string) => string>,
  G extends Record<string, (...args: any[]) => string[]>,
>(CACHE: C, CACHE_GRAPH: G) {
  /**
   * Invalide un tag (updateTag — expire immédiat, l'utilisateur voit sa propre
   * écriture). try/catch silencieux : safe hors runtime Next (scripts, seed).
   *
   * LISTE  : invalidateCache("EXAMPLES", scopeId)
   * DÉTAIL : invalidateCache("EXAMPLES", scopeId, exampleId)
   */
  async function invalidateCache(
    keyName: keyof C,
    scopeId?: string,
    id?: string
  ) {
    try {
      updateTag(CACHE[keyName](scopeId, id));
    } catch {
      // silencieux volontaire (scripts / hors contexte Server Action)
    }
  }

  /**
   * Invalide tous les tags d'un événement métier (graphe par service).
   *
   * @example
   * await invalidateEvent("EXAMPLE_CREATED", scopeId);
   */
  async function invalidateEvent<E extends keyof G>(
    event: E,
    ...args: Parameters<G[E]>
  ) {
    try {
      const fn = CACHE_GRAPH[event];
      const tags = (fn as (...a: typeof args) => string[])(...args);
      for (const tag of tags) {
        updateTag(tag);
      }
    } catch {
      // silencieux volontaire (scripts / hors contexte Server Action)
    }
  }

  return { invalidateCache, invalidateEvent };
}
