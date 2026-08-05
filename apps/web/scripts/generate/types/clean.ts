#!/usr/bin/env tsx
/**
 * scripts/generate/types/clean.ts
 *
 * Nettoie les fichiers `types.ts` des services en supprimant les définitions de types
 * qui suivent la convention de nommage du générateur (Dto, DtoItem, DtoNotNull).
 * Ces types seront régénérés dans `generated.types.ts` par le script `types.ts`.
 *
 * Usage:
 *   npx tsx scripts/generate/types/clean.ts              # nettoie tous les services
 *   npx tsx scripts/generate/types/clean.ts <service>    # nettoie un service spécifique
 *   npx tsx scripts/generate/types/clean.ts --dry-run    # simulation (ne modifie rien)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../..");
const SERVICES_DIR = path.join(ROOT, "src/services");

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const targetServices = args.filter((a) => a !== "--dry-run");

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Vérifie si un nom de type suit la convention générée.
 * Exemples : GetEventsDto, GetEventsDtoItem, GetEventsDtoNotNull
 */
function isGeneratedTypeName(name: string): boolean {
  return /^[A-Z]\w*Dto(Item|NotNull)?$/.test(name);
}

/**
 * Supprime les définitions de type générées dans le contenu d'un fichier.
 * Retourne le contenu modifié et le nombre de définitions supprimées.
 */
function removeGeneratedTypes(content: string): { newContent: string; removed: string[] } {
  const lines = content.split("\n");
  const keptLines: string[] = [];
  const removed: string[] = [];

  for (const line of lines) {
    // Capture les export type ... = ...
    const match = /^export\s+type\s+(\w+)\s*=\s*/.exec(line);
    if (match) {
      const typeName = match[1];
      if (isGeneratedTypeName(typeName)) {
        removed.push(typeName);
        continue; // on saute cette ligne
      }
    }
    keptLines.push(line);
  }

  return { newContent: keptLines.join("\n"), removed };
}

/**
 * Vérifie et ajoute l'export de generated.types si absent.
 */
function ensureGeneratedExport(content: string): string {
  const hasExport = /export\s+\*\s+from\s+['"]\.\/generated\.types['"]/.test(content);
  if (hasExport) return content;

  // Ajoute en fin de fichier, avant les éventuels sauts de ligne
  const trimmed = content.trimEnd();
  return trimmed + (trimmed ? "\n" : "") + "export * from './generated.types'\n";
}

// ── Traitement d'un service ──────────────────────────────────────────────────

function cleanService(servicePath: string): void {
  const serviceDir = path.join(SERVICES_DIR, servicePath);
  const typesPath = path.join(serviceDir, "types.ts");

  if (!fs.existsSync(typesPath)) {
    console.log(`  ⏭️  ${servicePath}/types.ts n'existe pas, ignoré.`);
    return;
  }

  const content = fs.readFileSync(typesPath, "utf8");
  const { newContent, removed } = removeGeneratedTypes(content);

  if (removed.length === 0 && content === newContent) {
    console.log(`  ✅ ${servicePath}/types.ts inchangé (aucun type généré trouvé).`);
    return;
  }

  // Si des types ont été supprimés, on ajoute l'export de generated.types
  let finalContent = newContent;
  if (removed.length > 0) {
    finalContent = ensureGeneratedExport(finalContent);
  }

  if (dryRun) {
    console.log(`  🔍 ${servicePath}/types.ts : ${removed.length} type(s) à supprimer :`);
    for (const name of removed) {
      console.log(`       - ${name}`);
    }
    return;
  }

  // Écriture du fichier modifié
  fs.writeFileSync(typesPath, finalContent, "utf8");
  console.log(`  🧹 ${servicePath}/types.ts : ${removed.length} type(s) supprimé(s).`);
}

// ── Découverte des services ──────────────────────────────────────────────────

function collectServices(): string[] {
  const services: string[] = [];

  function walk(dir: string, base = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        const full = path.join(dir, entry.name);
        const rel = base ? `${base}/${entry.name}` : entry.name;
        // Vérifier s'il s'agit d'un service (présence de database/ ou actions/)
        const hasDb = fs.existsSync(path.join(full, "database"));
        const hasActions = fs.existsSync(path.join(full, "actions"));
        if (hasDb || hasActions) {
          services.push(rel);
        }
        walk(full, rel);
      }
    }
  }

  walk(SERVICES_DIR);
  return services;
}

// ── Point d'entrée ───────────────────────────────────────────────────────────

function main() {
  console.log(`🧹 ${dryRun ? "[DRY RUN] " : ""}Nettoyage des types générés dans les services\n`);

  let services: string[];
  if (targetServices.length > 0) {
    services = targetServices;
  } else {
    services = collectServices();
  }

  if (services.length === 0) {
    console.log("Aucun service trouvé.");
    return;
  }

  for (const svc of services) {
    cleanService(svc);
  }

  console.log(`\n✅ ${dryRun ? "[DRY RUN] " : ""}Terminé.`);
}

main();