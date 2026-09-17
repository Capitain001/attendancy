// scripts/generate/service/cache.ts
//
// Patch des DEUX registres cache lors de la génération d'un service, depuis
// la scission de src/cache/server/key.ts (registre pur CACHE) et
// src/cache/server/graph.ts (CACHE_GRAPH + invalidateEvent) :
//   - key.ts   → entrée `CACHE.<X>`
//   - graph.ts → import du `<X>_GRAPH` + spread dans CACHE_GRAPH
//
// Logique pure (ne lit aucun état de CLI — tout est passé en paramètre),
// Chemins par défaut : voir ./config.ts.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { IMPORT_PATHS } from "./config";

// Re-exportés pour compat — la source unique reste ./config.ts.
export { DEFAULT_KEY_REGISTRY_PATH, DEFAULT_GRAPH_REGISTRY_PATH } from "./config";

export const KEY_REGISTRY_MARKER_ENTRY =
  "// ⚠ À ÉTENDRE PAR PROJET — une entrée par entité cachée :";
export const GRAPH_REGISTRY_MARKER_IMPORT =
  "// ⚠ À ÉTENDRE PAR PROJET — un import par service à données cachées :";
export const GRAPH_REGISTRY_MARKER_SPREAD =
  "// ⚠ À ÉTENDRE PAR PROJET — spreader chaque <SERVICE>_GRAPH importé :";

export type RegistryResult =
  | "patched"
  | "already-present"
  | "not-found"
  | "markers-missing";

export interface RegisterCacheGraphParams {
  kebabName: string;
  eventPrefix: string;
  cacheKeySlug: string;
  keyRegistryPath: string;
  graphRegistryPath: string;
}

export interface RegisterCacheGraphResult {
  key: RegistryResult;
  graph: RegistryResult;
}

function patchKeyRegistry({
  eventPrefix,
  cacheKeySlug,
  keyRegistryPath,
}: RegisterCacheGraphParams): RegistryResult {
  if (!existsSync(keyRegistryPath)) return "not-found";

  let content = readFileSync(keyRegistryPath, "utf-8");
  if (content.includes(`  ${eventPrefix}: key(`)) return "already-present";
  if (!content.includes(KEY_REGISTRY_MARKER_ENTRY)) return "markers-missing";

  const entryLine = `  ${eventPrefix}: key("${cacheKeySlug}"),\n`;
  content = content.replace(KEY_REGISTRY_MARKER_ENTRY, entryLine + KEY_REGISTRY_MARKER_ENTRY);

  writeFileSync(keyRegistryPath, content, "utf-8");
  return "patched";
}

function patchGraphRegistry({
  kebabName,
  eventPrefix,
  graphRegistryPath,
}: RegisterCacheGraphParams): RegistryResult {
  if (!existsSync(graphRegistryPath)) return "not-found";

  let content = readFileSync(graphRegistryPath, "utf-8");
  const graphName = `${eventPrefix}_GRAPH`;

  if (content.includes(`${graphName} }`) || content.includes(`...${graphName}`)) {
    return "already-present";
  }

  const hasAllMarkers =
    content.includes(GRAPH_REGISTRY_MARKER_IMPORT) &&
    content.includes(GRAPH_REGISTRY_MARKER_SPREAD);

  if (!hasAllMarkers) return "markers-missing";

  const importLine = `import { ${graphName} } from "${IMPORT_PATHS.servicesRoot}/${kebabName}/cache";\n`;
  const spreadLine = `  ...${graphName},\n`;

  content = content.replace(
    GRAPH_REGISTRY_MARKER_IMPORT,
    importLine + GRAPH_REGISTRY_MARKER_IMPORT,
  );
  content = content.replace(
    GRAPH_REGISTRY_MARKER_SPREAD,
    spreadLine + GRAPH_REGISTRY_MARKER_SPREAD,
  );

  writeFileSync(graphRegistryPath, content, "utf-8");
  return "patched";
}

/**
 * Enregistre le `<X>_GRAPH` d'un service dans les deux registres cache.
 * Pure — prend tout en paramètre, ne lit ni argv ni flags — réutilisable
 * depuis n'importe quel script générateur.
 */
export function registerInCacheRegistry(
  params: RegisterCacheGraphParams,
): RegisterCacheGraphResult {
  return {
    key: patchKeyRegistry(params),
    graph: patchGraphRegistry(params),
  };
}

/** Affiche le résultat d'un patch de registre (log ou warn selon le cas). */
export function logCacheRegistryResult(
  label: string,
  path: string,
  result: RegistryResult,
): void {
  switch (result) {
    case "patched":
      console.log(`✔ ${label} enregistré (${path}).`);
      break;
    case "already-present":
      console.log(`⏭  ${label} déjà présent dans ${path} — rien à faire.`);
      break;
    case "not-found":
      console.warn(`⚠ Registre introuvable (${path}) — enregistrement manuel requis pour ${label}.`);
      break;
    case "markers-missing":
      console.warn(
        `⚠ Les marqueurs "⚠ À ÉTENDRE PAR PROJET" sont absents de ${path} — ` +
          `enregistrement manuel requis pour ${label}.`,
      );
      break;
  }
}
