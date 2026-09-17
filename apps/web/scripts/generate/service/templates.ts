// scripts/generate/service/templates.ts
//
// Gabarits de fichiers générés pour un service — mode COMMENTÉ (référence,
// façon `entity`) et mode ACTIF (--minimal, code exécutable pour agent IA).
//
// Zéro lecture d'argv/flags ici : tout arrive via `ServiceContext`. Les
// alias d'import viennent de ./config.ts (IMPORT_PATHS) — jamais en dur —
// c'est ce qui garantit que service.ts et create-service.ts ne peuvent plus
// diverger silencieusement sur un chemin comme @/lib/prisma vs @/lib/db.
//
// service.ts ne fait qu'appeler `buildTemplates(ctx)` et sélectionner
// commenté/actif via `file()` — aucune logique de contenu n'y vit.

import { DEFAULT_MUTATION_ROLE, IMPORT_PATHS } from "./config";

export interface ServiceContext {
  kebabName: string;
  camelName: string;
  modelName: string;
  eventPrefix: string;
  softDelete: boolean;
  removeVerb: string;
  removeEvent: string;
}

export interface ServiceTemplates {
  fileIndexRootCommented(): string;
  fileIndexRootMinimal(): string;
  fileCacheCommented(): string;
  fileCacheMinimal(): string;
  fileConstantsCommented(): string;
  fileConstantsMinimal(): string;
  fileTypesCommented(): string;
  fileTypesMinimal(): string;
  fileValidationCommented(): string;
  fileValidationMinimal(): string;
  fileActionsIndexCommented(): string;
  fileActionsIndexMinimal(): string;
  fileActionsQueriesCommented(): string;
  fileActionsQueriesMinimal(): string;
  fileActionsMutationsCommented(): string;
  fileActionsMutationsMinimal(): string;
  fileDatabaseIndexCommented(): string;
  fileDatabaseIndexMinimal(): string;
  fileDatabaseQueriesCommented(): string;
  fileDatabaseQueriesMinimal(): string;
  fileDatabaseMutationsCommented(): string;
  fileDatabaseMutationsMinimal(): string;
  fileTestHelpersCommented(): string;
  fileTestHelpersMinimal(): string;
  fileClaudeMd(): string;
}

export function buildTemplates(ctx: ServiceContext): ServiceTemplates {
  const { kebabName, camelName, modelName, eventPrefix, softDelete, removeVerb, removeEvent } = ctx;

  // ─── Mode COMMENTÉ (référence, façon `entity`) ─────────────────────────

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
// import { CACHE } from "${IMPORT_PATHS.cacheKey}";
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
// import type { ${modelName}Status } from "${IMPORT_PATHS.prismaTypes}";
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
// import { authAccess } from "${IMPORT_PATHS.authService}";
// import { ERRORS } from "${IMPORT_PATHS.errorsConfig}";
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
// import { authAccess } from "${IMPORT_PATHS.authService}";
// import { ERRORS } from "${IMPORT_PATHS.errorsConfig}";
// import { create${modelName}Schema } from "../validation";
// import { create${modelName}, ${removeVerb}${modelName} } from "../database";
// import { logAuditAsync } from "${IMPORT_PATHS.auditService}";
//
// export async function create${modelName}Action(input: unknown) {
//   const parsed = v.safeParse(create${modelName}Schema, input);
//   if (!parsed.success) {
//     return { error: parsed.issues[0]?.message ?? "Donnees invalides" };
//   }
//
//   const auth = await authAccess({ requiredRole: "${DEFAULT_MUTATION_ROLE}" });
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
//   const auth = await authAccess({ requiredRole: "${DEFAULT_MUTATION_ROLE}" });
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
// import { cacheTag, cacheLife } from "${IMPORT_PATHS.nextCache}";
// import { prisma } from "${IMPORT_PATHS.prisma}";
// import { CACHE } from "${IMPORT_PATHS.cacheKey}";
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
// import { prisma } from "${IMPORT_PATHS.prisma}";
// import { tryConstraint } from "${IMPORT_PATHS.prismaTryConstraint}";
// import { invalidateEvent } from "${IMPORT_PATHS.cacheGraph}";
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
// import { prisma } from "${IMPORT_PATHS.prisma}";
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

  // ─── Mode ACTIF (--minimal, code exécutable pour agent IA) ─────────────

  function fileIndexRootMinimal(): string {
    return `export * from "./actions";
export * from "./types";
export * from "./validation";
export { ${eventPrefix}_GRAPH } from "./cache";
`;
  }

  function fileCacheMinimal(): string {
    return `import { CACHE } from "${IMPORT_PATHS.cacheKey}";

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
// import type { ${modelName}Status } from "${IMPORT_PATHS.prismaTypes}";
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

import { authAccess } from "${IMPORT_PATHS.authService}";
import { ERRORS } from "${IMPORT_PATHS.errorsConfig}";
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
import { authAccess } from "${IMPORT_PATHS.authService}";
import { ERRORS } from "${IMPORT_PATHS.errorsConfig}";
import { create${modelName}Schema } from "../validation";
import { create${modelName}, ${removeVerb}${modelName} } from "../database";
import { logAuditAsync } from "${IMPORT_PATHS.auditService}";

export async function create${modelName}Action(input: unknown) {
  const parsed = v.safeParse(create${modelName}Schema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Donnees invalides" };
  }

  const auth = await authAccess({ requiredRole: "${DEFAULT_MUTATION_ROLE}" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await create${modelName}({ ...parsed.output, orgId }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function ${removeVerb}${modelName}Action(${camelName}Id: string) {
  const auth = await authAccess({ requiredRole: "${DEFAULT_MUTATION_ROLE}" });
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
    return `import { cacheTag, cacheLife } from "${IMPORT_PATHS.nextCache}";
import { prisma } from "${IMPORT_PATHS.prisma}";
import { CACHE } from "${IMPORT_PATHS.cacheKey}";

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

    return `import { prisma } from "${IMPORT_PATHS.prisma}";
import { tryConstraint } from "${IMPORT_PATHS.prismaTryConstraint}";
import { invalidateEvent } from "${IMPORT_PATHS.cacheGraph}";

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
    return `import { prisma } from "${IMPORT_PATHS.prisma}";

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

  // CLAUDE.md ne dépend pas du mode commenté/actif : c'est de la doc, pas du
  // code à décommenter.

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

  return {
    fileIndexRootCommented,
    fileIndexRootMinimal,
    fileCacheCommented,
    fileCacheMinimal,
    fileConstantsCommented,
    fileConstantsMinimal,
    fileTypesCommented,
    fileTypesMinimal,
    fileValidationCommented,
    fileValidationMinimal,
    fileActionsIndexCommented,
    fileActionsIndexMinimal,
    fileActionsQueriesCommented,
    fileActionsQueriesMinimal,
    fileActionsMutationsCommented,
    fileActionsMutationsMinimal,
    fileDatabaseIndexCommented,
    fileDatabaseIndexMinimal,
    fileDatabaseQueriesCommented,
    fileDatabaseQueriesMinimal,
    fileDatabaseMutationsCommented,
    fileDatabaseMutationsMinimal,
    fileTestHelpersCommented,
    fileTestHelpersMinimal,
    fileClaudeMd,
  };
}
