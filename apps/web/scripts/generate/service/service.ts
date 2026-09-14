#!/usr/bin/env tsx
// scripts/generate/service.ts
//
// Génère la structure minimale d'un service `src/services/<name>/`, conforme
// au pattern documenté dans `service-module-pattern` (cf. `src/services/entity/`,
// le service de référence commenté).
//
// Usage :
//   npx tsx scripts/generate/service/service.ts <name> --model=<Model>
//   npx tsx scripts/generate/service/service.ts --name=<name> --model=<Model> [options]
//
// Options :
//   --name=<kebab>          Nom du service (alternative au positionnel)
//   --model=<Pascal>        Modèle Prisma (déduit de <name> si omis)
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

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs, toKebabCase, toPascalCase, toCamelCase, toScreamingSnake } from "./cli-utils";
import {
  DEFAULT_KEY_REGISTRY_PATH,
  DEFAULT_GRAPH_REGISTRY_PATH,
  registerInCacheRegistry,
  logCacheRegistryResult,
} from "./cache-registry";

// ─── Parsing des arguments ──────────────────────────────────────────────────────
// (parseArgs + helpers de casse : voir ./cli-utils.ts, partagé avec
// create-service.ts — ne pas redupliquer ici.)

function printUsageAndExit(message?: string): never {
  if (message) console.error(`✖ ${message}\n`);
  console.error(
    [
      "Usage:",
      "  npx tsx scripts/generate/service/service.ts <name> --model=<Model>",
      "  npx tsx scripts/generate/service/service.ts --name=<name> --model=<Model> [options]",
      "",
      "Options:",
      "  --name=<kebab>          Nom du service (alternative au positionnel)",
      "  --model=<Pascal>        Modèle Prisma (déduit de <name> si omis)",
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

// ─── Helpers de casse ──────────────────────────────────────────────────────────
// (voir ./cli-utils.ts, importé ci-dessus — partagé avec create-service.ts)

// ─── Résolution des paramètres ───────────────────────────────────────────────────

const kebabName = toKebabCase(rawName);
const camelName = toCamelCase(kebabName);
const modelName = rawModel ?? toPascalCase(kebabName);

// Slug complet (avec préfixe de domaine éventuel) — sert à la fois de nom de
// clé CACHE et de racine des noms d'événements. ue + course-teacher → ue-course-teacher.
const cacheKeySlug = prefixFlag ? `${toKebabCase(prefixFlag)}-${kebabName}` : kebabName;
const eventPrefix = toScreamingSnake(cacheKeySlug);
const removeVerb = softDelete ? "remove" : "delete";
const removeVerbPascal = softDelete ? "Remove" : "Delete";
const removeEvent = softDelete ? "REMOVED" : "DELETED";

const SERVICES_ROOT = join(process.cwd(), "src", "services");
const serviceDir = join(SERVICES_ROOT, kebabName);

// Chemins par défaut des deux registres cache — voir ./cache-registry.ts
// (importé ci-dessus, partagé avec create-service.ts).
const keyRegistryPath = keyRegistryPathFlag
  ? join(process.cwd(), keyRegistryPathFlag)
  : DEFAULT_KEY_REGISTRY_PATH;
const graphRegistryPath = graphRegistryPathFlag
  ? join(process.cwd(), graphRegistryPathFlag)
  : DEFAULT_GRAPH_REGISTRY_PATH;

// ─── Écriture fichier ──────────────────────────────────────────────────────────

function writeFile(relativePath: string, content: string): void {
  const fullPath = join(serviceDir, relativePath);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content, "utf-8");
  console.log(`  + ${join(kebabName, relativePath)}`);
}

// ─── Gabarits — mode COMMENTÉ (référence, façon `entity`) ─────────────────────────

function fileIndexRootCommented(): string {
  return `// Barrel public du service — actions + types + validation UNIQUEMENT.
// database/ n'est jamais réexporté ici (frontend passe toujours par actions/).

export * from "./actions";
export * from "./types";
export * from "./validation";
// export { ${eventPrefix}_GRAPH } from "./cache";
`;
}

function fileCacheCommented(): string {
  return `// src/services/${kebabName}/cache.ts
//
// Graphe événement → tags à invalider. À enregistrer :
// - entrée CACHE.${eventPrefix} dans src/cache/server/key.ts
// - import + spread dans CACHE_GRAPH de src/cache/server/graph.ts
//
// import { CACHE } from "@/cache/server/key";
//
// export const ${eventPrefix}_GRAPH = {
//   ${eventPrefix}_CREATED: (orgId: string) => [CACHE.${eventPrefix}(orgId)],
//   ${eventPrefix}_UPDATED: (orgId: string, ${camelName}Id: string) => [
//     CACHE.${eventPrefix}(orgId),
//     CACHE.${eventPrefix}(orgId, ${camelName}Id),
//   ],
//   ${eventPrefix}_${removeEvent}: (orgId: string, ${camelName}Id: string) => [
//     CACHE.${eventPrefix}(orgId),
//     CACHE.${eventPrefix}(orgId, ${camelName}Id),
//   ],
// } as const;

export {};
`;
}

function fileConstantsCommented(): string {
  return `// src/services/${kebabName}/constants.ts
//
// Constantes du domaine. Enum aligné compile-time sur Prisma via
// "as const satisfies readonly EnumType[]" + labels en Record.
//
// import type { ${modelName}Status } from "@/generated/prisma/client";
//
// export const ${eventPrefix}_STATUSES = [] as const satisfies readonly ${modelName}Status[];
// export type ${modelName}StatusValue = (typeof ${eventPrefix}_STATUSES)[number];

export {};
`;
}

function fileTypesCommented(): string {
  return `// src/services/${kebabName}/types.ts
//
// DTOs inférés depuis database/ — jamais de type manuel.
// GÉNÉRABLE : npx tsx scripts/generate/types/types.ts ${kebabName}
//
// import type { get${modelName}s, get${modelName} } from "./database";
//
// export type Get${modelName}sDto = Awaited<ReturnType<typeof get${modelName}s>>;
// export type Get${modelName}Dto = Awaited<ReturnType<typeof get${modelName}>>;

export {};
`;
}

function fileValidationCommented(): string {
  return `// src/services/${kebabName}/validation.ts
//
// Valibot uniquement — jamais Zod. IDs : pipe(string(), uuid("Message")).
//
// import { object, string, pipe, trim, minLength, maxLength } from "valibot";
// import type { InferInput } from "valibot";
//
// export const create${modelName}Schema = object({
//   name: pipe(string(), trim(), minLength(1, "Nom requis"), maxLength(100)),
// });
//
// export type Create${modelName}Input = InferInput<typeof create${modelName}Schema>;

export {};
`;
}

function fileActionsIndexCommented(): string {
  return `// Barrel actions/ — un export * par fichier une fois décommenté :
// export * from "./${kebabName}.queries";
// export * from "./${kebabName}.mutations";
export {};
`;
}

function fileActionsQueriesCommented(): string {
  return `// src/services/${kebabName}/actions/${kebabName}.queries.ts
//
// Seule porte d'entrée du frontend (pages RSC incluses) vers les données.
// Pattern : "use server" -> authAccess() -> orgId depuis le token UNIQUEMENT
// -> { data } / { error: string } -> jamais de throw vers le client.
// Préfixe get* (jamais list*), suffixe Action.
//
// "use server";
// import { authAccess } from "@/services/auth";
// import { ERRORS } from "@/config";
// import { get${modelName}s } from "../database";
//
// export async function get${modelName}sAction() {
//   const auth = await authAccess();
//   if (!auth.data) return { error: auth.error };
//   const { orgId } = auth.data;
//
//   try {
//     return { data: await get${modelName}s(orgId) };
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER };
//   }
// }

export {};
`;
}

function fileActionsMutationsCommented(): string {
  return `// src/services/${kebabName}/actions/${kebabName}.mutations.ts
//
// "use server" -> v.safeParse (Valibot) -> authAccess (role + orgId token)
// -> database/ -> audit si critique -> { data } / { error }.
//
// "use server";
// import * as v from "valibot";
// import { authAccess } from "@/services/auth";
// import { ERRORS } from "@/config";
// import { create${modelName}Schema } from "../validation";
// import { create${modelName}, ${removeVerb}${modelName} } from "../database";
// import { logAuditAsync } from "@/services/audit";
//
// export async function create${modelName}Action(input: unknown) {
//   const parsed = v.safeParse(create${modelName}Schema, input);
//   if (!parsed.success) {
//     return { error: parsed.issues[0]?.message ?? "Donnees invalides" };
//   }
//
//   const auth = await authAccess({ requiredRole: "ADMIN" });
//   if (!auth.data) return { error: auth.error };
//   const { orgId } = auth.data;
//
//   try {
//     return { data: await create${modelName}({ ...parsed.output, orgId }) };
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER };
//   }
// }
//
// export async function ${removeVerb}${modelName}Action(${camelName}Id: string) {
//   const auth = await authAccess({ requiredRole: "ADMIN" });
//   if (!auth.data) return { error: auth.error };
//   const { user, orgId } = auth.data;
//
//   try {
//     const result = await ${removeVerb}${modelName}(${camelName}Id, orgId);
//     logAuditAsync({
//       userId: user.id,
//       orgId,
//       action: "DELETE",
//       resource: "${modelName.toUpperCase()}",
//       resourceId: ${camelName}Id,
//       actor: { name: user.name, email: user.email },
//     });
//     return { data: result };
//   } catch (error) {
//     return { error: error instanceof Error ? error.message : ERRORS.SERVER };
//   }
// }

export {};
`;
}

function fileDatabaseIndexCommented(): string {
  return `// Barrel database/ (interne — jamais importé hors service) :
// export * from "./${kebabName}.queries";
// export * from "./${kebabName}.mutations";
export {};
`;
}

function fileDatabaseQueriesCommented(): string {
  const whereClause = softDelete ? "{ orgId, deletedAt: null }" : "{ orgId }";
  return `// src/services/${kebabName}/database/${kebabName}.queries.ts
//
// Prisma pur. AUCUNE auth ici — orgId arrive en paramètre depuis actions/.
// "use cache" en première instruction, cacheTag/cacheLife, select explicite${
    softDelete ? ", deletedAt: null (soft-delete)." : "."
  }
//
// import { cacheTag, cacheLife } from "next/cache";
// import { prisma } from "@/lib/prisma";
// import { CACHE } from "@/cache/server/key";
//
// export async function get${modelName}s(orgId: string) {
//   "use cache";
//   cacheTag(CACHE.${eventPrefix}(orgId));
//   cacheLife(CACHE.${eventPrefix}.life);
//   return prisma.${camelName}.findMany({
//     where: ${whereClause},
//     select: { id: true },
//   });
// }

export {};
`;
}

function fileDatabaseMutationsCommented(): string {
  const softDeleteBody = `//   const result = await tryConstraint(
//     prisma.${camelName}.update({
//       where: { id: ${camelName}Id, orgId, deletedAt: null },
//       data: { deletedAt: new Date() },
//       select: { id: true },
//     }),
//   );`;
  const hardDeleteBody = `//   const result = await tryConstraint(
//     prisma.${camelName}.delete({
//       where: { id: ${camelName}Id, orgId },
//       select: { id: true },
//     }),
//   );`;

  return `// src/services/${kebabName}/database/${kebabName}.mutations.ts
//
// tryConstraint() autour de chaque appel Prisma, invalidateEvent() après
// chaque mutation réussie, orgId dans le where (multi-tenant strict).
// ${softDelete ? "remove* = soft delete (deletedAt)." : "delete* = hard delete."}
//
// import { prisma } from "@/lib/prisma";
// import { tryConstraint } from "@/utils/server/prisma";
// import { invalidateEvent } from "@/cache/server/graph";
//
// export type Create${modelName}Data = { name: string; orgId: string };
//
// export async function create${modelName}({ orgId, ...data }: Create${modelName}Data) {
//   const result = await tryConstraint(
//     prisma.${camelName}.create({ data: { ...data, orgId }, select: { id: true } }),
//   );
//   await invalidateEvent("${eventPrefix}_CREATED", orgId);
//   return result;
// }
//
// export async function ${removeVerb}${modelName}(${camelName}Id: string, orgId: string) {
${softDelete ? softDeleteBody : hardDeleteBody}
//   await invalidateEvent("${eventPrefix}_${removeEvent}", orgId, ${camelName}Id);
//   return result;
// }

export {};
`;
}

function fileTestHelpersCommented(): string {
  return `// src/services/${kebabName}/__tests__/${kebabName}.helpers.ts
//
// Helpers de test d'intégration. Prérequis : npm run test:db:setup
// (base TEST_DATABASE_URL). Chaque test crée son propre tenant isolé.
//
// import { prisma } from "@/lib/prisma";
//
// export async function createTestOrg() {
//   return prisma.organization.create({
//     data: { name: \`test-org-\${Date.now()}\`, slug: \`test-\${crypto.randomUUID()}\` },
//     select: { id: true, slug: true },
//   });
// }
//
// export async function cleanupTestOrg(orgId: string) {
//   await prisma.${camelName}.deleteMany({ where: { orgId } });
//   await prisma.organization.delete({ where: { id: orgId } });
// }

export {};
`;
}

// ─── Gabarits — mode ACTIF (--minimal, code exécutable pour agent IA) ─────────────

function fileIndexRootMinimal(): string {
  return `export * from "./actions";
export * from "./types";
export * from "./validation";
export { ${eventPrefix}_GRAPH } from "./cache";
`;
}

function fileCacheMinimal(): string {
  return `import { CACHE } from "@/cache/server/key";

export const ${eventPrefix}_GRAPH = {
  ${eventPrefix}_CREATED: (orgId: string) => [CACHE.${eventPrefix}(orgId)],
  ${eventPrefix}_UPDATED: (orgId: string, ${camelName}Id: string) => [
    CACHE.${eventPrefix}(orgId),
    CACHE.${eventPrefix}(orgId, ${camelName}Id),
  ],
  ${eventPrefix}_${removeEvent}: (orgId: string, ${camelName}Id: string) => [
    CACHE.${eventPrefix}(orgId),
    CACHE.${eventPrefix}(orgId, ${camelName}Id),
  ],
} as const;
`;
}

function fileConstantsMinimal(): string {
  return `// TODO: enums du domaine ${modelName} si nécessaire — aligner sur Prisma :
// import type { ${modelName}Status } from "@/generated/prisma/client";
// export const ${eventPrefix}_STATUSES = [] as const satisfies readonly ${modelName}Status[];
// export type ${modelName}StatusValue = (typeof ${eventPrefix}_STATUSES)[number];

export {};
`;
}

function fileTypesMinimal(): string {
  return `import type { get${modelName}s, get${modelName} } from "./database";

export type Get${modelName}sDto = Awaited<ReturnType<typeof get${modelName}s>>;
export type Get${modelName}Dto = Awaited<ReturnType<typeof get${modelName}>>;
`;
}

function fileValidationMinimal(): string {
  return `import { object, string, pipe, trim, minLength, maxLength } from "valibot";
import type { InferInput } from "valibot";

// TODO: remplacer par les vrais champs du modèle ${modelName}
export const create${modelName}Schema = object({
  name: pipe(string(), trim(), minLength(1, "Nom requis"), maxLength(100)),
});

export type Create${modelName}Input = InferInput<typeof create${modelName}Schema>;
`;
}

function fileActionsIndexMinimal(): string {
  return `export * from "./${kebabName}.queries";
export * from "./${kebabName}.mutations";
`;
}

function fileActionsQueriesMinimal(): string {
  return `"use server";

import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { get${modelName}s } from "../database";

export async function get${modelName}sAction() {
  const auth = await authAccess();
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await get${modelName}s(orgId) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
`;
}

function fileActionsMutationsMinimal(): string {
  return `"use server";

import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import { create${modelName}Schema } from "../validation";
import { create${modelName}, ${removeVerb}${modelName} } from "../database";
import { logAuditAsync } from "@/services/audit";

export async function create${modelName}Action(input: unknown) {
  const parsed = v.safeParse(create${modelName}Schema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Donnees invalides" };
  }

  const auth = await authAccess({ requiredRole: "ADMIN" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await create${modelName}({ ...parsed.output, orgId }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function ${removeVerb}${modelName}Action(${camelName}Id: string) {
  const auth = await authAccess({ requiredRole: "ADMIN" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  try {
    const result = await ${removeVerb}${modelName}(${camelName}Id, orgId);
    logAuditAsync({
      userId: user.id,
      orgId,
      action: "DELETE",
      resource: "${modelName.toUpperCase()}",
      resourceId: ${camelName}Id,
      actor: { name: user.name, email: user.email },
    });
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
`;
}

function fileDatabaseIndexMinimal(): string {
  return `export * from "./${kebabName}.queries";
export * from "./${kebabName}.mutations";
`;
}

function fileDatabaseQueriesMinimal(): string {
  const whereClause = softDelete ? "{ orgId, deletedAt: null }" : "{ orgId }";
  return `import { cacheTag, cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE } from "@/cache/server/key";

export async function get${modelName}s(orgId: string) {
  "use cache";
  cacheTag(CACHE.${eventPrefix}(orgId));
  cacheLife(CACHE.${eventPrefix}.life);
  // TODO: select explicite — pas de findMany({}) sans select
  return prisma.${camelName}.findMany({
    where: ${whereClause},
    select: { id: true },
  });
}
`;
}

function fileDatabaseMutationsMinimal(): string {
  const removeBody = softDelete
    ? `  const result = await tryConstraint(
    prisma.${camelName}.update({
      where: { id: ${camelName}Id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    }),
  );`
    : `  const result = await tryConstraint(
    prisma.${camelName}.delete({
      where: { id: ${camelName}Id, orgId },
      select: { id: true },
    }),
  );`;

  return `import { prisma } from "@/lib/prisma";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/graph";

// TODO: remplacer par les vrais champs du modèle ${modelName}
export type Create${modelName}Data = { name: string; orgId: string };

export async function create${modelName}({ orgId, ...data }: Create${modelName}Data) {
  const result = await tryConstraint(
    prisma.${camelName}.create({ data: { ...data, orgId }, select: { id: true } }),
  );
  await invalidateEvent("${eventPrefix}_CREATED", orgId);
  return result;
}

export async function ${removeVerb}${modelName}(${camelName}Id: string, orgId: string) {
${removeBody}
  await invalidateEvent("${eventPrefix}_${removeEvent}", orgId, ${camelName}Id);
  return result;
}
`;
}

function fileTestHelpersMinimal(): string {
  return `import { prisma } from "@/lib/prisma";

export async function createTestOrg() {
  return prisma.organization.create({
    data: { name: \`test-org-\${Date.now()}\`, slug: \`test-\${crypto.randomUUID()}\` },
    select: { id: true, slug: true },
  });
}

export async function cleanupTestOrg(orgId: string) {
  await prisma.${camelName}.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
}
`;
}

// ─── Sélecteur commenté / actif ────────────────────────────────────────────────

function file(commented: () => string, activeCode: () => string): string {
  return minimal ? activeCode() : commented();
}

// CLAUDE.md ne dépend pas de --minimal : c'est de la doc, pas du code à décommenter.

function fileClaudeMd(): string {
  return `# Service \`${kebabName}\`

## Rôle
<!-- TODO : une phrase — ce que ce service possède et gère. -->

## Modèle Prisma
\`${modelName}\` — \`prisma.${camelName}\` uniquement dans ce service.
Régime de suppression : ${softDelete ? "**soft delete** (`deletedAt`, `remove*`)" : "**hard delete** (`delete*`)"}.

## Fichiers
- \`database/${kebabName}.queries.ts\` — lectures Prisma (\`"use cache"\`)
- \`database/${kebabName}.mutations.ts\` — écritures Prisma (\`tryConstraint\` + \`invalidateEvent\`)
- \`cache.ts\` — graphe d'invalidation (\`${eventPrefix}_GRAPH\`)
- \`validation.ts\` — schémas Valibot
- \`actions/${kebabName}.queries.ts\` — queries exposées au frontend
- \`actions/${kebabName}.mutations.ts\` — mutations \`"use server"\`
- \`constants.ts\`, \`types.ts\` — enums + DTOs inférés

## Contraintes
<!-- TODO : invariants métier, index partiels, triggers DB liés (le cas échéant). -->

## Questions ouvertes
<!-- TODO -->

## Commandes

CMD des generateurs pour le service ${kebabName} :
\`\`\`bash
# index API
npx tsx scripts/generate/api/api.ts ${kebabName}

# types
npx tsx scripts/generate/types/types.ts ${kebabName}

# résumé
npx tsx scripts/generate/summary/summary.ts ${kebabName}
\`\`\`
`;
}

// ─── Enregistrement automatique dans src/cache/server/{key,graph}.ts ──────────
// (registerInCacheRegistry + logCacheRegistryResult : voir ./cache-registry.ts,
// importé ci-dessus — partagé avec create-service.ts, ne pas redupliquer)

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

  writeFile("index.ts", file(fileIndexRootCommented, fileIndexRootMinimal));
  writeFile("cache.ts", file(fileCacheCommented, fileCacheMinimal));
  writeFile("constants.ts", file(fileConstantsCommented, fileConstantsMinimal));
  writeFile("types.ts", file(fileTypesCommented, fileTypesMinimal));
  writeFile("validation.ts", file(fileValidationCommented, fileValidationMinimal));

  writeFile("actions/index.ts", file(fileActionsIndexCommented, fileActionsIndexMinimal));
  writeFile(
    `actions/${kebabName}.queries.ts`,
    file(fileActionsQueriesCommented, fileActionsQueriesMinimal),
  );
  writeFile(
    `actions/${kebabName}.mutations.ts`,
    file(fileActionsMutationsCommented, fileActionsMutationsMinimal),
  );

  writeFile("database/index.ts", file(fileDatabaseIndexCommented, fileDatabaseIndexMinimal));
  writeFile(
    `database/${kebabName}.queries.ts`,
    file(fileDatabaseQueriesCommented, fileDatabaseQueriesMinimal),
  );
  writeFile(
    `database/${kebabName}.mutations.ts`,
    file(fileDatabaseMutationsCommented, fileDatabaseMutationsMinimal),
  );

  writeFile(
    `__tests__/${kebabName}.helpers.ts`,
    file(fileTestHelpersCommented, fileTestHelpersMinimal),
  );

  writeFile("CLAUDE.md", fileClaudeMd());
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