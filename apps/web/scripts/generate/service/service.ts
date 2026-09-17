#!/usr/bin/env tsx
// scripts/generate/service/service.ts
//
// Génère la structure minimale d'un service `src/services/<n>/`, conforme
// au pattern documenté dans `service-module-pattern` (cf. `src/services/entity/`,
// le service de référence commenté).
//
// Usage :
//   npx tsx scripts/generate/service/service.ts <n> --model=<Model>
//   npx tsx scripts/generate/service/service.ts --name=<n> --model=<Model> [options]
//
// Options :
//   --name=<kebab>          Nom du service (alternative au positionnel)
//   --model=<Pascal>        Modèle Prisma (déduit de <n> si omis)
//   --prefix=<kebab>        Préfixe de domaine pour les clés cache/événements
//                           (ex: --prefix=ue → UE_COURSE_TEACHER_CREATED
//                           au lieu de COURSE_TEACHER_CREATED)
//   --soft-delete           Génère remove* (deletedAt) au lieu de delete* (hard delete)
//   --minimal                Code ACTIF non commenté (imports réels, fonctions
//                           exécutables) au lieu du gabarit commenté façon
//                           `entity`. Pensé pour un agent IA qui va tout de
//                           suite remplir/adapter — évite l'aller-retour
//                           "décommenter + réécrire".
//   --skip-cache-registry    N'essaie pas de patcher src/cache/server/{key,graph}.ts
//   --key-registry=<path>    Chemin de key.ts si différent du défaut
//   --graph-registry=<path>  Chemin de graph.ts si différent du défaut
//   --force                  Écrase un service existant
//
// Exemples :
//   npx tsx scripts/generate/service/service.ts course-teacher --model=CourseTeacher
//   npx tsx scripts/generate/service/service.ts --name=course-teacher --model=CourseTeacher --prefix=ue --soft-delete --minimal
//
// Le script NE remplit PAS de logique métier : il pose le squelette (fichiers
// + fonctions à compléter), à charge de l'auteur de brancher Prisma dessus.
//
// Répartition des responsabilités (ne pas ré-empiler du contenu ici) :
//   ./config.ts    → chemins racine, alias d'import, valeurs par défaut
//   ./utils.ts     → parsing CLI + conversions de casse (pur, sans état)
//   ./cache.ts     → patch des registres src/cache/server/{key,graph}.ts
//   ./templates.ts → contenu des fichiers générés (commenté + --minimal)
//   service.ts     → uniquement : lire les flags, résoudre les paramètres,
//                    écrire les fichiers, patcher les registres, logguer.

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs, toKebabCase, toPascalCase, toCamelCase, toScreamingSnake } from "./utils";
import {
  SERVICES_ROOT,
  DEFAULT_KEY_REGISTRY_PATH,
  DEFAULT_GRAPH_REGISTRY_PATH,
} from "./config";
import { registerInCacheRegistry, logCacheRegistryResult } from "./cache";
import { buildTemplates, type ServiceContext } from "./templates";

// ─── Parsing des arguments ──────────────────────────────────────────────────

function printUsageAndExit(message?: string): never {
  if (message) console.error(`✖ ${message}\n`);
  console.error(
    [
      "Usage:",
      "  npx tsx scripts/generate/service/service.ts <n> --model=<Model>",
      "  npx tsx scripts/generate/service/service.ts --name=<n> --model=<Model> [options]",
      "",
      "Options:",
      "  --name=<kebab>          Nom du service (alternative au positionnel)",
      "  --model=<Pascal>        Modèle Prisma (déduit de <n> si omis)",
      "  --prefix=<kebab>        Préfixe de domaine pour cache/événements",
      "  --soft-delete           Génère remove* (deletedAt) au lieu de delete* (hard delete)",
      "  --minimal               Code actif non commenté (pour agent IA)",
      "  --skip-cache-registry   N'écrit pas dans src/cache/server/{key,graph}.ts",
      "  --key-registry=<path>   Chemin de key.ts si non standard",
      "  --graph-registry=<path> Chemin de graph.ts si non standard",
      "  --force                 Écrase un service existant",
      "",
      "Exemple:",
      "  npx tsx scripts/generate/service/service.ts course-teacher --model=CourseTeacher --prefix=ue --soft-delete --minimal",
    ].join("\n"),
  );
  process.exit(1);
}

const { positional, flags } = parseArgs(process.argv.slice(2));

const rawName = (flags.name as string) ?? positional[0];
if (!rawName) printUsageAndExit("Nom du service manquant (positionnel ou --name=).");

const force = flags.force === true;
const softDelete = flags["soft-delete"] === true;
const minimal = flags.minimal === true;
const skipCacheRegistry = flags["skip-cache-registry"] === true;
const prefixFlag = typeof flags.prefix === "string" ? flags.prefix : undefined;
const rawModel = typeof flags.model === "string" ? flags.model : undefined;
const keyRegistryPathFlag =
  typeof flags["key-registry"] === "string" ? flags["key-registry"] : undefined;
const graphRegistryPathFlag =
  typeof flags["graph-registry"] === "string" ? flags["graph-registry"] : undefined;

// ─── Résolution des paramètres ───────────────────────────────────────────────

const kebabName = toKebabCase(rawName);
const camelName = toCamelCase(kebabName);
const modelName = rawModel ?? toPascalCase(kebabName);

// Slug complet (avec préfixe de domaine éventuel) — sert à la fois de nom de
// clé CACHE et de racine des noms d'événements. ue + course-teacher → ue-course-teacher.
const cacheKeySlug = prefixFlag ? `${toKebabCase(prefixFlag)}-${kebabName}` : kebabName;
const eventPrefix = toScreamingSnake(cacheKeySlug);
const removeVerb = softDelete ? "remove" : "delete";
const removeEvent = softDelete ? "REMOVED" : "DELETED";

const serviceDir = join(SERVICES_ROOT, kebabName);

// Chemins des deux registres cache — défauts dans ./config.ts, surchargeables
// via --key-registry / --graph-registry.
const keyRegistryPath = keyRegistryPathFlag
  ? join(process.cwd(), keyRegistryPathFlag)
  : DEFAULT_KEY_REGISTRY_PATH;
const graphRegistryPath = graphRegistryPathFlag
  ? join(process.cwd(), graphRegistryPathFlag)
  : DEFAULT_GRAPH_REGISTRY_PATH;

const ctx: ServiceContext = {
  kebabName,
  camelName,
  modelName,
  eventPrefix,
  softDelete,
  removeVerb,
  removeEvent,
};
const t = buildTemplates(ctx);

// ─── Écriture fichier ──────────────────────────────────────────────────────

function writeFile(relativePath: string, content: string): void {
  const fullPath = join(serviceDir, relativePath);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content, "utf-8");
  console.log(`  + ${join(kebabName, relativePath)}`);
}

// ─── Sélecteur commenté / actif ─────────────────────────────────────────────

function file(commented: () => string, activeCode: () => string): string {
  return minimal ? activeCode() : commented();
}

// ─── Génération ──────────────────────────────────────────────────────────────

function main(): void {
  if (existsSync(serviceDir) && !force) {
    console.error(
      `✖ src/services/${kebabName}/ existe déjà. Utilise --force pour écraser.`,
    );
    process.exit(1);
  }

  console.log(
    `Génération du service "${kebabName}" (modèle: ${modelName}, préfixe: ${eventPrefix}, ` +
      `${softDelete ? "soft delete" : "hard delete"}, mode: ${minimal ? "actif (--minimal)" : "commenté (référence)"})\n`,
  );

  writeFile("index.ts", file(t.fileIndexRootCommented, t.fileIndexRootMinimal));
  writeFile("cache.ts", file(t.fileCacheCommented, t.fileCacheMinimal));
  writeFile("constants.ts", file(t.fileConstantsCommented, t.fileConstantsMinimal));
  writeFile("types.ts", file(t.fileTypesCommented, t.fileTypesMinimal));
  writeFile("validation.ts", file(t.fileValidationCommented, t.fileValidationMinimal));

  writeFile("actions/index.ts", file(t.fileActionsIndexCommented, t.fileActionsIndexMinimal));
  writeFile(
    `actions/${kebabName}.queries.ts`,
    file(t.fileActionsQueriesCommented, t.fileActionsQueriesMinimal),
  );
  writeFile(
    `actions/${kebabName}.mutations.ts`,
    file(t.fileActionsMutationsCommented, t.fileActionsMutationsMinimal),
  );

  writeFile("database/index.ts", file(t.fileDatabaseIndexCommented, t.fileDatabaseIndexMinimal));
  writeFile(
    `database/${kebabName}.queries.ts`,
    file(t.fileDatabaseQueriesCommented, t.fileDatabaseQueriesMinimal),
  );
  writeFile(
    `database/${kebabName}.mutations.ts`,
    file(t.fileDatabaseMutationsCommented, t.fileDatabaseMutationsMinimal),
  );

  writeFile(
    `__tests__/${kebabName}.helpers.ts`,
    file(t.fileTestHelpersCommented, t.fileTestHelpersMinimal),
  );

  writeFile("CLAUDE.md", t.fileClaudeMd());
  // Pas de index.json à la racine : l'index API canonique est `.api/index.json`,
  // écrit par `generate:api` (étape 5 ci-dessous). Un fichier racine serait un
  // orphelin qu'aucun outil ne lit (api/summary ne scannent que `.api/`).

  console.log(`\n✔ Service "${kebabName}" créé dans src/services/${kebabName}/`);

  // ── Registres cache (key.ts + graph.ts) ─────────────────────────────────────
  if (skipCacheRegistry) {
    console.log(`\n⏭  Registres cache non touchés (--skip-cache-registry).`);
  } else {
    const result = registerInCacheRegistry({
      kebabName,
      eventPrefix,
      cacheKeySlug,
      keyRegistryPath,
      graphRegistryPath,
    });
    console.log("");
    logCacheRegistryResult(`CACHE.${eventPrefix}`, keyRegistryPath, result.key);
    logCacheRegistryResult(`${eventPrefix}_GRAPH`, graphRegistryPath, result.graph);
  }

  console.log(`\nProchaines étapes :`);
  if (minimal) {
    console.log(`  1. Remplacer les TODO (champs réels du modèle ${modelName})`);
  } else {
    console.log(`  1. Décommenter et adapter chaque fichier`);
  }
  if (skipCacheRegistry) {
    console.log(
      `  2. Enregistrer CACHE.${eventPrefix} dans src/cache/server/key.ts et ${eventPrefix}_GRAPH (import + spread) dans src/cache/server/graph.ts`,
    );
  }
  console.log(`  3. Compléter le CLAUDE.md (rôle, contraintes)`);
  console.log(`  4. Renseigner l'ownership dans src/services/SERVICE_CONTEXT.md`);
  console.log(
    `  5. npx tsx scripts/generate/types/types.ts ${kebabName} && npx tsx scripts/generate/api/api.ts ${kebabName}`,
  );
}

main();
