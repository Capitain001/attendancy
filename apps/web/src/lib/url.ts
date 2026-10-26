// lib/url.ts

/**
 * Ajoute un paramètre de version à une URL pour forcer le navigateur/CDN
 * à la recharger — utile quand le chemin d'une ressource reste fixe
 * (avatar, logo, document...) mais que son contenu change dans le temps.
 */
export function getRefreshUrl(
  url: string | null | undefined,
  version: string | number | Date | null | undefined,
): string | null {
  if (!url) return null;

  const ts = version instanceof Date
    ? version.getTime()
    : typeof version === "string"
      ? Date.parse(version)
      : version;

  if (!ts) return url;

  const urlObj = new URL(url);
  urlObj.searchParams.set("v", String(ts));
  return urlObj.toString();
}


type QueryValue = string | number | boolean | null | undefined

/**
 * Ajoute des paramètres de requête à une URL (relative ou absolue).
 * - `undefined`, `null` et `''` sont ignorés ; `false` et `0` sont conservés.
 * - Utilise `&` si l'URL contient déjà une query string, sinon `?`.
 * - Les valeurs sont encodées par URLSearchParams.
 * Limite : une URL contenant un fragment (#…) n'est pas gérée.
 */
export function buildQueryUrl(baseUrl: string, params: Record<string, QueryValue>): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }

  const queryString = query.toString()
  if (!queryString) return baseUrl

  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`
}