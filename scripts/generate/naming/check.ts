/**
 * scripts/generate/naming/check.ts
 *
 * Rappeleur de conventions de nommage — NON BLOQUANT (exit 0 toujours).
 * Lister les violations potentielles après avoir travaillé sur un service.
 *
 * Usage :
 *   npx tsx scripts/generate/naming/check.ts                   # tous les services
 *   npx tsx scripts/generate/naming/check.ts users             # 1 service
 *   npx tsx scripts/generate/naming/check.ts users group class # plusieurs services
 *
 * Conventions vérifiées (SKILL.md §database/<model>.mutations.ts) :
 *   • get*  — jamais list* (queries + actions)
 *   • remove* + *_REMOVED — soft delete (deletedAt)
 *   • delete* + *_DELETED — hard delete (prisma.X.delete)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../..");
const SERVICES_ROOT = path.join(ROOT, "src", "services");

// ── Couleurs ANSI ─────────────────────────────────────────────────────────────

const C = {
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  dim:    "\x1b[2m",
  bold:   "\x1b[1m",
  reset:  "\x1b[0m",
};

function yellow(s: string)  { return C.yellow + s + C.reset; }
function cyan(s: string)    { return C.cyan   + s + C.reset; }
function dim(s: string)     { return C.dim    + s + C.reset; }
function bold(s: string)    { return C.bold   + s + C.reset; }

// ── Types ─────────────────────────────────────────────────────────────────────

interface FnInfo {
  name: string;
  body: string;
  line: number;
}

interface Warning {
  service: string;
  file: string;
  fn: string;
  line: number;
  rule: string;
  message: string;
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

function relPath(abs: string): string {
  return path.relative(ROOT, abs).replace(/\\/g, "/");
}

/**
 * Extrait les fonctions exportées d'un fichier TS (source brut, pas d'AST).
 * Gère : `export [async] function name(...)` et `export const name = [async] (...) =>`
 */
function extractExportedFunctions(content: string): FnInfo[] {
  const fns: FnInfo[] = [];
  const lines = content.split("\n");

  // Index ligne pour une position char
  function lineAt(pos: number): number {
    return content.slice(0, pos).split("\n").length;
  }

  // Extrait le corps d'une fonction à partir de la première `{` trouvée après startPos.
  // Retourne le texte entre `{` et `}` appariée (braces counting).
  function extractBody(startPos: number): string {
    const braceStart = content.indexOf("{", startPos);
    if (braceStart === -1) return "";
    let depth = 0;
    for (let i = braceStart; i < content.length; i++) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") {
        depth--;
        if (depth === 0) return content.slice(braceStart, i + 1);
      }
    }
    return "";
  }

  // 1. export [async] function name(
  const fnRe = /\bexport\s+(?:async\s+)?function\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = fnRe.exec(content)) !== null) {
    const name = m[1];
    const body = extractBody(m.index);
    fns.push({ name, body, line: lineAt(m.index) });
  }

  // 2. export const name = [async] (...) => {
  const constRe = /\bexport\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
  while ((m = constRe.exec(content)) !== null) {
    const name = m[1];
    // Corps peut être après `=>` ou directement `{`
    const afterEq = content.indexOf("=>", m.index);
    const startSearch = afterEq !== -1 ? afterEq : m.index;
    const body = extractBody(startSearch);
    if (body) fns.push({ name, body, line: lineAt(m.index) });
  }

  return fns;
}

// ── Règles de nommage ─────────────────────────────────────────────────────────

const SOFT_DELETE_BODY = /deletedAt/;
const HARD_DELETE_BODY = /prisma\.\w+\.delete\s*\(/;
const EVENT_RE = /invalidateEvent\(\s*['"](\w+)['"]/g;

function checkFunctions(
  fns: FnInfo[],
  fileRel: string,
  service: string,
  isMutations: boolean,
): Warning[] {
  const warns: Warning[] = [];

  function warn(fn: FnInfo, rule: string, message: string) {
    warns.push({ service, file: fileRel, fn: fn.name, line: fn.line, rule, message });
  }

  for (const fn of fns) {
    // ── Règle 1 : list* → get* ──────────────────────────────────────────────
    if (fn.name.startsWith("list")) {
      const suggested = "get" + fn.name.slice(4);
      warn(fn, "list*→get*", `"${fn.name}" → renommer "${suggested}" (convention: get* jamais list*)`);
    }

    if (!isMutations) continue; // Règles 2-4 uniquement sur .mutations.ts

    const hasSoftDelete = SOFT_DELETE_BODY.test(fn.body);
    const hasHardDelete = HARD_DELETE_BODY.test(fn.body);

    // ── Règle 2 : delete* avec deletedAt → devrait être remove* ─────────────
    if (fn.name.startsWith("delete") && hasSoftDelete && !hasHardDelete) {
      const suffix = fn.name.slice(6); // "delete" = 6 chars
      const suggested = "remove" + suffix;
      warn(fn, "delete*/soft",
        `"${fn.name}" fait un soft delete (deletedAt) → renommer "${suggested}" + event *_REMOVED`);
    }

    // ── Règle 3 : remove* avec prisma.X.delete → devrait être delete* ───────
    if (fn.name.startsWith("remove") && hasHardDelete && !hasSoftDelete) {
      const suffix = fn.name.slice(6); // "remove" = 6 chars
      const suggested = "delete" + suffix;
      warn(fn, "remove*/hard",
        `"${fn.name}" fait un hard delete (prisma.X.delete) → renommer "${suggested}" + event *_DELETED`);
    }

    // ── Règle 4 : event name incohérent avec l'opération ────────────────────
    let evM: RegExpExecArray | null;
    const evRe = new RegExp(EVENT_RE.source, "g");
    while ((evM = evRe.exec(fn.body)) !== null) {
      const ev = evM[1];
      if (ev.endsWith("_DELETED") && hasSoftDelete && !hasHardDelete) {
        warn(fn, "event/soft",
          `event "${ev}" émis dans un soft delete → utiliser *_REMOVED à la place de *_DELETED`);
      }
      if (ev.endsWith("_REMOVED") && hasHardDelete && !hasSoftDelete) {
        warn(fn, "event/hard",
          `event "${ev}" émis dans un hard delete → utiliser *_DELETED à la place de *_REMOVED`);
      }
    }
  }

  return warns;
}

// ── Parcours des fichiers d'un service ───────────────────────────────────────

function collectServiceWarnings(serviceAbs: string): Warning[] {
  const service = path.relative(SERVICES_ROOT, serviceAbs).replace(/\\/g, "/");
  const warnings: Warning[] = [];

  function processFile(absPath: string) {
    if (!fs.existsSync(absPath)) return;
    const content = fs.readFileSync(absPath, "utf8");
    const fileRel = relPath(absPath);
    const isMutations = absPath.replace(/\\/g, "/").includes(".mutations.");
    const fns = extractExportedFunctions(content);
    warnings.push(...checkFunctions(fns, fileRel, service, isMutations));
  }

  // database/ ou database.ts
  const dbDir = path.join(serviceAbs, "database");
  if (fs.existsSync(dbDir) && fs.statSync(dbDir).isDirectory()) {
    for (const f of fs.readdirSync(dbDir)) {
      if (f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "index.ts") {
        processFile(path.join(dbDir, f));
      }
    }
  }
  const dbTs = path.join(serviceAbs, "database.ts");
  if (fs.existsSync(dbTs)) processFile(dbTs);

  // actions/ ou actions.ts
  const actDir = path.join(serviceAbs, "actions");
  if (fs.existsSync(actDir) && fs.statSync(actDir).isDirectory()) {
    for (const f of fs.readdirSync(actDir)) {
      if (f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "index.ts") {
        processFile(path.join(actDir, f));
      }
    }
  }
  const actTs = path.join(serviceAbs, "actions.ts");
  if (fs.existsSync(actTs)) processFile(actTs);

  return warnings;
}

// ── Collecte récursive des services ──────────────────────────────────────────

function isServiceDir(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "database")) ||
    fs.existsSync(path.join(dir, "database.ts")) ||
    fs.existsSync(path.join(dir, "actions")) ||
    fs.existsSync(path.join(dir, "actions.ts"))
  );
}

function walkServices(dir: string): string[] {
  const services: string[] = [];
  let entries: string[];
  try { entries = fs.readdirSync(dir); } catch { return []; }

  for (const name of entries) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const full = path.join(dir, name);
    try {
      if (!fs.statSync(full).isDirectory()) continue;
    } catch { continue; }

    if (isServiceDir(full)) services.push(full);
    services.push(...walkServices(full));
  }
  return services;
}

// ── Affichage ─────────────────────────────────────────────────────────────────

const RULE_LABELS: Record<string, string> = {
  "list*→get*":  "list*→get*",
  "delete*/soft":"delete→remove",
  "remove*/hard":"remove→delete",
  "event/soft":  "event *_REMOVED",
  "event/hard":  "event *_DELETED",
};

function printWarnings(all: Warning[]) {
  if (!all.length) {
    console.log(`\n${bold("✓")} Aucune violation de naming détectée.\n`);
    return;
  }

  // Grouper par service
  const byService = new Map<string, Warning[]>();
  for (const w of all) {
    if (!byService.has(w.service)) byService.set(w.service, []);
    byService.get(w.service)!.push(w);
  }

  console.log(`\n${bold("── Naming Convention Check ─────────────────────────────────────")}`);
  console.log(`   ${yellow(String(all.length) + " avertissement(s)")} — non bloquant\n`);

  for (const [service, warns] of byService) {
    console.log(cyan(`[${service}]`));
    for (const w of warns) {
      const label = RULE_LABELS[w.rule] ?? w.rule;
      console.log(`  ${yellow("⚠")}  ${bold(w.fn)}  ${dim(`[${label}]`)}`);
      console.log(`     ${dim(w.file + ":" + w.line)}`);
      console.log(`     ${w.message}`);
    }
    console.log();
  }

  console.log(
    dim(
      "Légende : soft delete = remove* / *_REMOVED  " +
      "· hard delete = delete* / *_DELETED  " +
      "· reads/actions = get* jamais list*"
    )
  );
  console.log();
}

// ── Point d'entrée ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--all");

  let serviceDirs: string[];
  if (!args.length) {
    serviceDirs = walkServices(SERVICES_ROOT);
  } else {
    serviceDirs = args.map((a) => path.join(SERVICES_ROOT, a));
    for (const d of serviceDirs) {
      if (!fs.existsSync(d)) {
        console.warn(`⚠  Service introuvable : ${relPath(d)}`);
      }
    }
    serviceDirs = serviceDirs.filter(fs.existsSync);
  }

  const allWarnings: Warning[] = [];
  for (const dir of serviceDirs) {
    allWarnings.push(...collectServiceWarnings(dir));
  }

  printWarnings(allWarnings);
  process.exit(0); // jamais bloquant
}

main();
