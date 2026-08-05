// scripts/generate/api/sync.ts
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// sync.ts vit sous scripts/generate/api/ (3 niveaux sous la racine).
const ROOT = path.resolve(__dirname, "../../..");
const SERVICES_DIR = path.join(ROOT, "src/services");

/**
 * Un service est éligible s'il contient au moins un fichier
 * database.ts, database/, ou actions.ts — sinon rien à indexer.
 */
function isEligibleService(serviceDir: string): boolean {
  return (
    fs.existsSync(path.join(serviceDir, "actions.ts")) ||
    fs.existsSync(path.join(serviceDir, "database.ts")) ||
    fs.existsSync(path.join(serviceDir, "database"))
  );
}

/**
 * Collecte récursivement tous les chemins de service éligibles
 * relatifs à src/services/ (ex: "entity", "resource", "users/profile").
 */
function collectServices(dir: string, base = ""): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;

    const fullPath = path.join(dir, entry);
    if (!fs.statSync(fullPath).isDirectory()) continue;

    const servicePath = base ? `${base}/${entry}` : entry;

    if (isEligibleService(fullPath)) {
      results.push(servicePath);
    }

    // Descendre pour les sous-services (ex: users/profile, entity/sub)
    results.push(...collectServices(fullPath, servicePath));
  }

  return results;
}

function main() {
  const services = collectServices(SERVICES_DIR);

  if (!services.length) {
    console.error("Aucun service éligible trouvé.");
    process.exit(1);
  }

  console.log(`\n sync-api — ${services.length} services détectés\n`);
  services.forEach((s) => console.log(`  · ${s}`));
  console.log();

  execSync(
    `npx tsx scripts/generate/api/api.ts ${services.join(" ")}`,
    { stdio: "inherit", cwd: ROOT }
  );
}

main();