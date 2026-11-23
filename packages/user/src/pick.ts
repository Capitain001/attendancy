/**
 * Copie les clés listées d'un objet, typée `Pick<T, K>` : le résultat suit exactement les clés
 * passées, sans cast chez l'appelant. Le seul cast est ici, sur l'objet vide, et il est vrai
 * puisque la boucle remplit chaque clé de K.
 */
export function pickKeys<T, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const picked = {} as Pick<T, K>;
  for (const key of keys) {
    picked[key] = source[key];
  }
  return picked;
}
