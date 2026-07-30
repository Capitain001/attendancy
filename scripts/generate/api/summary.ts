/**
 * //scripts/generate/api/summary.ts
 * summary — consolide les .api/ (1 fichier par fonction) en summary/
 * (1 fichier par service). Ne fait AUCUNE analyse AST : lecture pure des JSON
 * déjà produits par scripts/generate/api/api.ts.
 *
 * .api/     = source de vérité (édité/régénéré par api.ts, jamais à la main
 *              au-delà des champs manuels rules/why_ref/auth).
 * summary/  = vue dérivée, régénérable à tout moment depuis .api/ — jamais
 *              committée comme source de vérité, jamais éditée à la main.
 *
 * Avant toute consolidation : lance `api.ts --check` (cohérence cross-service).
 * Si le graphe est cassé (référence morte), summary/ n'est PAS régénéré — évite
 * de figer une vue consolidée sur un service incomplet/désynchronisé. Utiliser
 * --skip-check pour outrepasser (déconseillé, sauf debug ponctuel).
 *
 * Usage :
 *   tsx scripts/generate/api/summary.ts               # check puis tous les services
 *   tsx scripts/generate/api/summary.ts --all          # + summary/all.json
 *   tsx scripts/generate/api/summary.ts <service>      # un seul service
 *   tsx scripts/generate/api/summary.ts svc1 svc2      # plusieurs services
 *   tsx scripts/generate/api/summary.ts --skip-check   # bypass le check (déconseillé)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { PROJECT_LAYOUT } from "./config.js";
import { checkCrossService } from "./api.js";

// ── Chemins ───────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// summary.ts vit sous scripts/generate/api/ (3 niveaux sous la racine).
const ROOT = path.resolve(__dirname, "../../..");
const SERVICES_ROOT = PROJECT_LAYOUT.servicesRoot;
const SERVICES_DIR = path.join(ROOT, SERVICES_ROOT);
const SUMMARY_DIR = path.join(ROOT, "summary");

// ── Pré-check cross-service ───────────────────────────────────────────────────

async function runCrossServiceCheck(): Promise<boolean> {
  console.log("\n→ Vérification cross-service (api.ts --check)...\n");
  return checkCrossService();
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface IndexJson {
  service: string;
  path: string;
  claude_md?: string;
  derived_at: string;
  fns: Record<string, { f: string; layer: string; kind: string }>;
  edges: Record<string, string[]>;
  deps?: Record<string, string>;
}

interface ConsolidatedService {
  service: string;
  path: string;
  claude_md?: string;
  derived_at: string;
  generated_at: string;
  fns: Record<string, Record<string, unknown>>;
  edges: Record<string, string[]>;
  deps: Record<string, string>;
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

function readJson<T>(p: string): T | null {
  try {
    let content = fs.readFileSync(p, "utf8");
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function writeJson(p: string, data: unknown): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** "users/profile" → "users-profile" — nom de fichier plat, pas de sous-dossiers. */
function toFileName(servicePath: string): string {
  return servicePath.replace(/\//g, "-");
}

/** Recherche récursive de tous les .api/index.json sous src/services/. */
function findAllServices(): Array<{ servicePath: string; apiDir: string }> {
  const results: Array<{ servicePath: string; apiDir: string }> = [];

  function walk(dir: string): void {
    let names: string[];
    try { names = fs.readdirSync(dir); }
    catch { return; }

    for (const name of names) {
      const fullPath = path.join(dir, name);
      let isDir: boolean;
      try { isDir = fs.statSync(fullPath).isDirectory(); }
      catch { continue; }
      if (!isDir) continue;
      if (name === "node_modules") continue;

      if (name === ".api") {
        if (fs.existsSync(path.join(fullPath, "index.json"))) {
          const servicePath = path.relative(SERVICES_DIR, dir).replace(/\\/g, "/");
          results.push({ servicePath, apiDir: fullPath });
        }
        // ne pas descendre dans .api/
      } else {
        walk(fullPath);
      }
    }
  }

  walk(SERVICES_DIR);
  return results;
}

// ── Consolidation d'un service ────────────────────────────────────────────────

function consolidateService(
  servicePath: string,
  apiDir: string
): ConsolidatedService | null {
  const index = readJson<IndexJson>(path.join(apiDir, "index.json"));
  if (!index) {
    console.warn(`  ⚠ index.json illisible pour ${servicePath} — ignoré`);
    return null;
  }

  const fns: Record<string, Record<string, unknown>> = {};
  for (const [fnName, entry] of Object.entries(index.fns)) {
    const fichePath = path.join(apiDir, `${fnName}.json`);
    const fiche = readJson<Record<string, unknown>>(fichePath);
    if (!fiche) {
      console.warn(`  ⚠ ${servicePath} : fiche manquante pour "${fnName}" (${fichePath})`);
      continue;
    }
    fns[fnName] = { ...fiche, layer: entry.layer, kind: entry.kind };
  }

  return {
    service: index.service,
    path: index.path,
    claude_md: index.claude_md,
    derived_at: index.derived_at,
    generated_at: new Date().toISOString(),
    fns,
    edges: index.edges,
    deps: index.deps ?? {},
  };
}

// ── Point d'entrée ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const wantAll = args.includes("--all");
  const skipCheck = args.includes("--skip-check");
  const requested = args.filter((a) => a !== "--all" && a !== "--skip-check");

  if (!skipCheck) {
    const ok = await runCrossServiceCheck();
    if (!ok) {
      console.error(
        "\n✗ summary annulé : le graphe cross-service contient une référence morte.\n" +
        "  → Corriger (voir détail ci-dessus) puis relancer.\n" +
        "  → Ou forcer malgré tout : tsx scripts/generate/api/summary.ts --skip-check\n"
      );
      process.exit(1);
    }
    console.log("\n✓ Graphe cross-service cohérent — poursuite de la consolidation.\n");
  } else {
    console.warn("\n⚠ --skip-check : consolidation sans vérification cross-service.\n");
  }

  const discovered = findAllServices();

  const targets = requested.length
    ? discovered.filter((d) => requested.includes(d.servicePath))
    : discovered;

  if (!targets.length) {
    console.error(
      requested.length
        ? `Aucun service correspondant à : ${requested.join(", ")} (avez-vous lancé api.ts d'abord ?)`
        : `Aucun .api/ trouvé sous ${SERVICES_ROOT}/ — lancer d'abord scripts/generate/api/sync.ts`
    );
    process.exit(1);
  }

  console.log(`\nsummary — ${targets.length} service(s)\n`);

  const serviceSummaries: Array<{
    service: string;
    file: string;
    fnCount: number;
    derived_at: string;
  }> = [];

  const allServices: ConsolidatedService[] = [];

  for (const { servicePath, apiDir } of targets) {
    const consolidated = consolidateService(servicePath, apiDir);
    if (!consolidated) continue;

    const fileName = `${toFileName(servicePath)}.json`;
    writeJson(path.join(SUMMARY_DIR, fileName), consolidated);

    const fnCount = Object.keys(consolidated.fns).length;
    console.log(`  ✓ ${fileName}  (${fnCount} fns)`);

    serviceSummaries.push({
      service: consolidated.service,
      file: `summary/${fileName}`,
      fnCount,
      derived_at: consolidated.derived_at,
    });
    allServices.push(consolidated);
  }

  // index.json — table des matières, pour que l'IA sache quel fichier ouvrir
  writeJson(path.join(SUMMARY_DIR, "index.json"), {
    generated_at: new Date().toISOString(),
    services: serviceSummaries,
  });
  console.log(`  ✓ index.json  (${serviceSummaries.length} services référencés)`);

  // all.json — optionnel, uniquement sur --all (vue globale, coûteuse à charger)
  if (wantAll) {
    writeJson(path.join(SUMMARY_DIR, "all.json"), {
      generated_at: new Date().toISOString(),
      services: allServices,
    });
    console.log(`  ✓ all.json  (${allServices.length} services, vue globale)`);
  }

  console.log("\n✓ Consolidation terminée");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});