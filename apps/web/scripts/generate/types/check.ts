/**
 * scripts/generate/types/check.ts
 *
 * Vérifie que les types inférés `Awaited<ReturnType<...>>` sont définis
 * uniquement dans `generated.types.ts` — jamais dans database.ts, actions.ts, etc.
 * (`types.ts` est le barrel manuel : il ne doit contenir que du `export *`
 * et d'éventuelles surcharges manuelles, jamais un type inféré directement.)
 *
 * Non bloquant (exit 0 toujours).
 *
 * Usage :
 *   npx tsx scripts/generate/types/check.ts              # tous les services
 *   npx tsx scripts/generate/types/check.ts planning     # un service
 *   npx tsx scripts/generate/types/check.ts course room  # plusieurs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../..");
const SERVICES_ROOT = path.join(ROOT, "src", "services");

// ── Couleurs ANSI ─────────────────────────────────────────────────────────────

const C = { yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m", green: "\x1b[32m" };
const yellow = (s: string) => C.yellow + s + C.reset;
const cyan   = (s: string) => C.cyan   + s + C.reset;
const dim    = (s: string) => C.dim    + s + C.reset;
const bold   = (s: string) => C.bold   + s + C.reset;
const green  = (s: string) => C.green  + s + C.reset;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Violation {
  service: string;
  file:    string;
  line:    number;
  type:    string; // nom du type exporté (ex: OrgPlanningResources)
}

// ── Détection ─────────────────────────────────────────────────────────────────

// Capture : export type <Name> = Awaited<ReturnType<...>>
// ou       export type { ... } re-exports (ignorés, pas de = Awaited)
const INFERRED_TYPE_RE = /^export\s+type\s+(\w+)\s*=\s*Awaited\s*<\s*ReturnType\s*</gm;

function scanFile(absPath: string, service: string): Violation[] {
  const content = fs.readFileSync(absPath, "utf8");
  const fileRel = path.relative(ROOT, absPath).replace(/\\/g, "/");
  const lines   = content.split("\n");
  const violations: Violation[] = [];

  let m: RegExpExecArray | null;
  const re = new RegExp(INFERRED_TYPE_RE.source, "gm");
  while ((m = re.exec(content)) !== null) {
    const lineNo = content.slice(0, m.index).split("\n").length;
    violations.push({ service, file: fileRel, line: lineNo, type: m[1] });
  }

  return violations;
}

// ── Parcours des fichiers d'un service ───────────────────────────────────────

const EXCLUDED_FILES = new Set(["generated.types.ts", "index.ts"]);
const EXCLUDED_DIRS  = new Set([".api", "node_modules", "__tests__"]);

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try { entries = fs.readdirSync(dir); } catch { return []; }

  for (const name of entries) {
    if (EXCLUDED_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let stat: fs.Stats;
    try { stat = fs.statSync(full); } catch { continue; }

    if (stat.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (
      name.endsWith(".ts") &&
      !name.endsWith(".d.ts") &&
      !name.endsWith(".test.ts") &&
      !name.endsWith(".spec.ts") &&
      !EXCLUDED_FILES.has(name)
    ) {
      results.push(full);
    }
  }
  return results;
}

function collectServiceViolations(serviceAbs: string): Violation[] {
  const service = path.relative(SERVICES_ROOT, serviceAbs).replace(/\\/g, "/");
  const violations: Violation[] = [];

  for (const f of walkFiles(serviceAbs)) {
    violations.push(...scanFile(f, service));
  }

  return violations;
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
    try { if (!fs.statSync(full).isDirectory()) continue; } catch { continue; }
    if (isServiceDir(full)) services.push(full);
    services.push(...walkServices(full));
  }
  return services;
}

// ── Affichage ─────────────────────────────────────────────────────────────────

function print(all: Violation[]) {
  console.log(`\n${bold("── Inferred Types Placement Check ──────────────────────────────")}`);

  if (!all.length) {
    console.log(`   ${green("✓")} Tous les Awaited<ReturnType<...>> sont dans generated.types.ts\n`);
    return;
  }

  console.log(`   ${yellow("⚠  " + all.length + " violation(s)")} — non bloquant\n`);
  console.log(dim(`   Règle : export type X = Awaited<ReturnType<...>> appartient à generated.types.ts`));
  console.log(dim(`   Fix   : npm run generate:types:svc -- <service>\n`));

  const byService = new Map<string, Violation[]>();
  for (const v of all) {
    if (!byService.has(v.service)) byService.set(v.service, []);
    byService.get(v.service)!.push(v);
  }

  for (const [service, vs] of byService) {
    console.log(cyan(`[${service}]`));
    for (const v of vs) {
      console.log(`  ${yellow("⚠")}  type ${bold(v.type)}`);
      console.log(`     ${dim(v.file + ":" + v.line)}`);
      console.log(`     Déplacer vers src/services/${v.service}/generated.types.ts`);
    }
    console.log();
  }
}

// ── Point d'entrée ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--all");

  let serviceDirs: string[];
  if (!args.length) {
    serviceDirs = walkServices(SERVICES_ROOT);
  } else {
    serviceDirs = args.map((a) => path.join(SERVICES_ROOT, a));
    serviceDirs = serviceDirs.filter((d) => {
      if (!fs.existsSync(d)) { console.warn(`⚠  Service introuvable : ${d}`); return false; }
      return true;
    });
  }

  const all: Violation[] = [];
  for (const dir of serviceDirs) {
    all.push(...collectServiceViolations(dir));
  }

  print(all);
  process.exit(0);
}

main();