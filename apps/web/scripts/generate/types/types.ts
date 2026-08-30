#!/usr/bin/env tsx
/**
 * scripts/generate/types/types.ts
 *
 * Génère src/services/<service>/generated.types.ts depuis TOUT fichier .ts
 * de database/ (sauf le barrel index.ts) — queries.ts, mutations.ts, et
 * toute catégorie optionnelle du skill service-module-pattern (analytics.ts,
 * rpc.ts, ou une future catégorie non encore inventée). Pas de whitelist de
 * suffixes à maintenir : le dossier database/ EST le contrat.
 *
 * Naming : fnName → export type FnNameDto = Awaited<ReturnType<typeof fn>>
 * Seules les fonctions `export function` / `export async function` sont
 * captées — un fichier qui n'exporte que des `const`/helpers/types reste
 * invisible au générateur, sans avoir besoin de l'exclure explicitement.
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

// Fichiers exclus du scan de database/ — jamais un fichier de fonctions
// exposées. Le barrel réexporte, il ne définit rien à typer.
const EXCLUDED_DB_FILES = new Set(["index.ts"]);

function isDbFile(fileName: string, fullPath: string): boolean {
  if (!fileName.endsWith(".ts")) return false;
  if (EXCLUDED_DB_FILES.has(fileName)) return false;
  return fs.statSync(fullPath).isFile();
}

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

  const dbFiles = fs
    .readdirSync(dbDir)
    .filter((f) => isDbFile(f, path.join(dbDir, f)));

  if (!dbFiles.length) {
    console.log(`  ⚠ ${servicePath} : aucun fichier .ts dans database/ (hors index.ts) — skip`);
    return true;
  }

  const fns: string[] = [];
  for (const f of dbFiles) {
    fns.push(...extractExportedFns(path.join(dbDir, f)));
  }

  if (!fns.length) {
    console.log(`  ⚠ ${servicePath} : aucune fonction 'export function' dans database/ — skip`);
    return true;
  }

  // Garde-fou : deux fonctions de même nom (ex. dans queries.ts et analytics.ts)
  // généreraient un type dupliqué — on dédoublonne en gardant la 1ère occurrence
  // et on avertit, plutôt que d'écrire un fichier invalide.
  const seen = new Set<string>();
  const dupes: string[] = [];
  const uniqueFns = fns.filter((fn) => {
    if (seen.has(fn)) {
      dupes.push(fn);
      return false;
    }
    seen.add(fn);
    return true;
  });
  if (dupes.length) {
    console.warn(
      `  ⚠ ${servicePath} : fonction(s) exportée(s) en double dans database/ — ignorée(s) après la 1ère occurrence : ${dupes.join(", ")}`
    );
  }

  const generatedTypeNames = uniqueFns.map((fn) => `${toPascalCase(fn)}Dto`);

  const lines = [
    `// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN`,
    `// Régénérer : npx tsx scripts/generate/types/types.ts ${servicePath}`,
    `// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).`,
    "",
    `import { ${uniqueFns.join(", ")} } from './database'`,
    "",
    ...uniqueFns.map(
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
    const hasDbFiles =
      fs.existsSync(dbDir) &&
      fs.readdirSync(dbDir).some((f) => isDbFile(f, path.join(dbDir, f)));

    if (hasDbFiles) results.push(servicePath);

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