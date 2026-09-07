#!/usr/bin/env tsx
/**
 * scripts/generate/referentiel/check.ts
 *
 * Vérifie que chaque service DOMAIN de src/generated/referentiel.ts (généré)
 * a une entrée dans DOMAIN_DESCRIPTIONS de src/services/referentiel.ts
 * (manuel). Non bloquant (exit 0) pour les descriptions manquantes.
 *
 * Parse le CONTENU TEXTE des deux fichiers (fs.readFileSync + regex) plutôt
 * que de les importer comme modules TS — même approche que clean.ts
 * (removeGeneratedTypes) et classify.ts (lecture des .prisma). Ça évite
 * toute dépendance à la résolution de module TypeScript pour un simple
 * script de diagnostic : le fichier généré n'a pas besoin d'être un module
 * valide/résolu par tsconfig pour que ce check fonctionne, seulement
 * d'exister comme texte lisible.
 *
 * Usage :
 *   npx tsx scripts/generate/referentiel/check.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../..");
const GENERATED_PATH = path.join(ROOT, "src", "generated", "referentiel.ts");
const MANUAL_PATH = path.join(ROOT, "src", "services", "referentiel.ts");

const C = { yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m", green: "\x1b[32m" };
const yellow = (s: string) => C.yellow + s + C.reset;
const bold = (s: string) => C.bold + s + C.reset;
const green = (s: string) => C.green + s + C.reset;
const dim = (s: string) => C.dim + s + C.reset;

// Extrait les clés (quotées ou non) d'un objet littéral
// `export const <name> = { key: {...}, 'key-with-dash': {...} } satisfies ...`
// via comptage d'accolades — robuste aux objets imbriqués (path: {...}).
function extractObjectKeys(content: string, constName: string): string[] {
  const startRe = new RegExp(`export\\s+const\\s+${constName}\\s*=\\s*\\{`);
  const startMatch = startRe.exec(content);
  if (!startMatch) return [];

  let depth = 1;
  let i = startMatch.index + startMatch[0].length;
  const blockStart = i;
  while (i < content.length && depth > 0) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") depth--;
    i++;
  }
  const block = content.slice(blockStart, i - 1);

  const keys: string[] = [];
  const keyRe = /^\s*(?:'([\w-]+)'|"([\w-]+)"|(\w[\w-]*))\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = keyRe.exec(block)) !== null) {
    keys.push(m[1] ?? m[2] ?? m[3]);
  }
  return keys;
}

function main() {
  console.log(`\n${bold("── Referentiel DOMAIN_DESCRIPTIONS Check ───────────────────────")}`);

  if (!fs.existsSync(GENERATED_PATH)) {
    console.error(
      `\n✗ ${dim(path.relative(ROOT, GENERATED_PATH))} introuvable — lance d'abord :\n` +
        `  npx tsx scripts/generate/referentiel/referentiel.ts\n`,
    );
    process.exit(1);
  }

  if (!fs.existsSync(MANUAL_PATH)) {
    console.error(`\n✗ ${dim(path.relative(ROOT, MANUAL_PATH))} introuvable.\n`);
    process.exit(1);
  }

  const generatedContent = fs.readFileSync(GENERATED_PATH, "utf8");
  const manualContent = fs.readFileSync(MANUAL_PATH, "utf8");

  const domainFolders = extractObjectKeys(generatedContent, "DOMAIN_SERVICES");
  const describedFolders = new Set(extractObjectKeys(manualContent, "DOMAIN_DESCRIPTIONS"));

  const missing = domainFolders.filter((folder) => !describedFolders.has(folder));

  if (missing.length === 0) {
    console.log(`   ${green("✓")} Tous les services DOMAIN ont une description\n`);
    process.exit(0);
  }

  console.log(`   ${yellow("⚠  " + missing.length + " service(s) DOMAIN sans description")} — non bloquant\n`);
  missing.forEach((folder) => console.log(`     ○ ${folder}`));
  console.log(dim(`\n   Fix : ajouter une entrée dans src/services/referentiel.ts (DOMAIN_DESCRIPTIONS)\n`));

  process.exit(0);
}

main();