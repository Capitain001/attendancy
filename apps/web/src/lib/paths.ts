type SlugPaths = Record<string, (slug: string) => string>;

// Résout un objet de chemins `(slug) => string` en `{ clé: chemin }`.
export function resolveSlugPaths<P extends SlugPaths>(slug: string, paths: P) {
  return Object.fromEntries(
    Object.entries(paths).map(([key, path]) => [key, path(slug)]),
  ) as { [K in keyof P]: string };
}
