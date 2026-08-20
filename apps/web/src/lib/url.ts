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