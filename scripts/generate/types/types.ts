#!/usr/bin/env tsx
/**
 * scripts/generate/types/types.ts
 *
 * Génère src/services/<service>/generated.types.ts depuis database/*.queries.ts.
 * Naming : fnName → export type FnNameDto = Awaited<ReturnType<typeof fn>>
 * Seules les fonctions exportées des fichiers *.queries.ts sont incluses.
 *
 * `generated.types.ts` est intégralement régénéré à chaque run (écrasement volontaire).
 * `types.ts` (barrel public, manuel) n'est JAMAIS écrasé — le script s'assure seulement
 * qu'il ré-exporte `./generated.types`, sans toucher au reste de son contenu.
 *
 * Usage:
 *   tsx scripts/generate/types/types.ts <service> [<service2> ...]
 *   tsx scripts/generate/types/types.ts --all
 *
 * Exemples:
 *   tsx scripts/generate/types/types.ts class
 *   tsx scripts/generate/types/types.ts class group enrollment
 *   tsx scripts/generate/types/types.ts --all
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../..");
const SERVICES_DIR = path.join(ROOT, "src/services");

// ── Extraction des noms de fonctions exportées ────────────────────────────────

function extractExportedFns(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8");
  const fns: string[] = [];
  const re = /^export\s+(?:async\s+)?function\s+(\w+)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    fns.push(m[1]);
  }
  return fns;
}

// ── Extraction des noms de types déjà exportés dans un fichier (pour détecter les collisions) ──

function extractExportedTypeNames(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const names: string[] = [];
  const re = /^export\s+(?:type|interface)\s+(\w+)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    names.push(m[1]);
  }
  return names;
}

function toPascalCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Mise à jour du barrel index.ts (inchangé — pointe toujours vers './types') ──

function ensureTypesExport(indexPath: string): void {
  if (!fs.existsSync(indexPath)) return;
  const content = fs.readFileSync(indexPath, "utf8");
  if (content.includes("from './types'") || content.includes('from "./types"')) return;
  fs.appendFileSync(indexPath, `export * from './types'\n`, "utf8");
  console.log(`  ↳ index.ts  — export * from './types' ajouté`);
}

// ── Mise à jour du barrel manuel types.ts pour ré-exporter generated.types.ts ──
//
// types.ts n'est JAMAIS écrasé. On se contente d'y ajouter, si absent,
// `export * from './generated.types'`. Si une collision de nom est détectée
// entre un type manuel de types.ts et un DTO généré, on n'ajoute RIEN et on
// avertit — au dev de trancher manuellement (voir CONTEXT.md).

function ensureGeneratedReExport(serviceDir: string, generatedTypeNames: string[]): void {
  const typesPath = path.join(serviceDir, "types.ts");

  if (!fs.existsSync(typesPath)) {
    fs.writeFileSync(typesPath, `export * from './generated.types'\n`, "utf8");
    console.log(`  ↳ types.ts créé — export * from './generated.types'`);
    return;
  }

  const content = fs.readFileSync(typesPath, "utf8");
  if (content.includes("from './generated.types'") || content.includes('from "./generated.types"')) {
    return; // déjà en place, rien à faire
  }

  const manualNames = extractExportedTypeNames(typesPath);
  const collisions = generatedTypeNames.filter((n) => manualNames.includes(n));

  if (collisions.length) {
    console.warn(
      `  ⚠ types.ts : collision de nom avec generated.types.ts — re-export NON ajouté automatiquement`
    );
    console.warn(`     Types en conflit : ${collisions.join(", ")}`);
    console.warn(
      `     → Renommez le type manuel dans types.ts, OU supprimez-le s'il est devenu redondant,`
    );
    console.warn(`       puis ajoutez vous-même : export * from './generated.types'`);
    return;
  }

  fs.appendFileSync(typesPath, `\nexport * from './generated.types'\n`, "utf8");
  console.log(`  ↳ types.ts — export * from './generated.types' ajouté`);
}

// ── Génération d'un service ───────────────────────────────────────────────────

function generateForService(servicePath: string): boolean {
  const serviceDir = path.join(SERVICES_DIR, servicePath);

  if (!fs.existsSync(serviceDir)) {
    console.error(`  ✗ Service introuvable : ${serviceDir}`);
    return false;
  }

  const dbDir = path.join(serviceDir, "database");
  if (!fs.existsSync(dbDir)) {
    console.log(`  ⚠ ${servicePath} : pas de dossier database/ — skip`);
    return true;
  }

  const queryFiles = fs
    .readdirSync(dbDir)
    .filter((f) => f.endsWith(".queries.ts"));

  if (!queryFiles.length) {
    console.log(`  ⚠ ${servicePath} : aucun *.queries.ts — skip`);
    return true;
  }

  const fns: string[] = [];
  for (const f of queryFiles) {
    fns.push(...extractExportedFns(path.join(dbDir, f)));
  }

  if (!fns.length) {
    console.log(`  ⚠ ${servicePath} : aucune fn exportée dans queries — skip`);
    return true;
  }

  const generatedTypeNames = fns.map((fn) => `${toPascalCase(fn)}Dto`);

  const lines = [
    `// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN`,
    `// Régénérer : npx tsx scripts/generate/types/types.ts ${servicePath}`,
    `// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).`,
    "",
    `import { ${fns.join(", ")} } from './database'`,
    "",
    ...fns.map(
      (fn) =>
        `export type ${toPascalCase(fn)}Dto = Awaited<ReturnType<typeof ${fn}>>`
    ),
    "",
  ];

  const outputPath = path.join(serviceDir, "generated.types.ts");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");

  const typeNames = generatedTypeNames.join(", ");
  console.log(`  ✓ ${servicePath}/generated.types.ts  (${typeNames})`);

  ensureGeneratedReExport(serviceDir, generatedTypeNames);
  ensureTypesExport(path.join(serviceDir, "index.ts"));
  return true;
}

// ── Découverte automatique ────────────────────────────────────────────────────

function collectEligibleServices(dir: string, base = ""): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const fullPath = path.join(dir, entry);
    if (!fs.statSync(fullPath).isDirectory()) continue;

    const servicePath = base ? `${base}/${entry}` : entry;
    const dbDir = path.join(fullPath, "database");
    const hasQueries =
      fs.existsSync(dbDir) &&
      fs.readdirSync(dbDir).some((f) => f.endsWith(".queries.ts"));

    if (hasQueries) results.push(servicePath);

    results.push(...collectEligibleServices(fullPath, servicePath));
  }

  return results;
}

// ── Point d'entrée ────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);

  if (!args.length) {
    console.error(
      "Usage: tsx scripts/generate/types/types.ts <service> [...] | --all"
    );
    process.exit(1);
  }

  const services =
    args[0] === "--all" ? collectEligibleServices(SERVICES_DIR) : args;

  if (!services.length) {
    console.log("Aucun service éligible trouvé.");
    return;
  }

  console.log(`\ntypes  ${services.length} service(s)\n`);

  let ok = true;
  for (const svc of services) {
    ok = generateForService(svc) && ok;
  }

  if (!ok) process.exit(1);
  console.log("\n✓ Génération terminée");
}

main();