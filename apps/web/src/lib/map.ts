// src/lib/map.ts
import { getFullName } from "./utils";

export function withName<
  T extends { firstName?: string | null; lastName?: string | null }
>(user: T): Omit<T, "name"> & { name: string | null } {
  return {
    ...user,
    name: getFullName(user.firstName, user.lastName) || null,
  };
}


/** Rend toutes les clés optionnelles sauf celles listées dans K. */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>


export function hasId<T extends { id?: string }>(u: T | null | undefined): u is T & { id: string } {
  return !!u?.id
}


/**
 * Copie les clés listées d'un objet, typée `Pick<T, K>` : le résultat suit exactement les clés
 * passées, sans cast chez l'appelant. Le seul cast est ici, sur l'objet vide, et il est vrai
 * puisque la boucle remplit chaque clé de K.
 */
export function pickKeys<T, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  const picked = {} as Pick<T, K>
  for (const key of keys) picked[key] = source[key]
  return picked
}