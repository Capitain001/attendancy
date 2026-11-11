// scripts/generate/utils/services.ts
/**
 * //scripts/generate/utils/services.ts
 * Localisation des services : argument CLI → dossier, dossier → id canonique,
 * découverte des index `.api/`. Partagé par les générateurs (api, summary…).
 *
 * Convention : un service de `src/services/` s'identifie par son chemin relatif
 * à cette racine (`class`, `users/profile`) ; tout autre service par son chemin
 * relatif au projet (`src/features/personal/services/course`).
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { PROJECT_LAYOUT } from "../api/config.js";

// utils/ vit sous scripts/generate/ (3 niveaux sous la racine du projet).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SERVICES_DIR = path.join(ROOT, PROJECT_LAYOUT.servicesRoot);
const SRC_DIR = path.join(ROOT, "src");

const toPosix = (p: string) => p.replace(/\\/g, "/");

/** Argument CLI → dossier absolu. Relatif à src/services/ par défaut ; `src/...` pris tel quel. */
export function resolveServiceDir(arg: string): string {
  const a = toPosix(arg).replace(/\/+$/, "");
  return a.startsWith("src/") ? path.join(ROOT, a) : path.join(SERVICES_DIR, a);
}

/** Dossier absolu → id canonique du service (indépendant de la façon dont l'argument a été saisi). */
export function toServiceId(serviceAbs: string): string {
  const rel = toPosix(path.relative(SERVICES_DIR, serviceAbs));
  return rel.startsWith("..") ? toPosix(path.relative(ROOT, serviceAbs)) : rel;
}

/**
 * Id de service → chemin relatif dans summary/ (ex: "course" → "course.json",
 * "src/features/personal/services/course" → "personal/course.json",
 * "users/profile" → "users-profile.json").
 */
export function toSummaryRelPath(servicePath: string): string {
  const featureMatch = servicePath.match(/^src\/features\/([^/]+)\/services\/(.+)$/);
  if (featureMatch) {
    const [, feature, sub] = featureMatch;
    return `${feature}/${sub.replace(/\//g, "-")}.json`;
  }
  return `${servicePath.replace(/\//g, "-")}.json`;
}

/** Tous les services indexés (dossier contenant `.api/index.json`) sous src/, quel que soit leur emplacement. */
export function findServiceApis(): Array<{ servicePath: string; apiDir: string; indexPath: string }> {
  const results: Array<{ servicePath: string; apiDir: string; indexPath: string }> = [];

  function walk(dir: string): void {
    let names: string[];
    try { names = fs.readdirSync(dir); }
    catch { return; }

    for (const name of names) {
      const fullPath = path.join(dir, name);
      let isDir: boolean;
      try { isDir = fs.statSync(fullPath).isDirectory(); }
      catch { continue; }
      if (!isDir || name === "node_modules") continue;

      if (name === ".api") {
        const indexPath = path.join(fullPath, "index.json");
        if (fs.existsSync(indexPath)) {
          results.push({ servicePath: toServiceId(dir), apiDir: fullPath, indexPath });
        }
        // ne pas descendre dans .api/
      } else {
        walk(fullPath);
      }
    }
  }

  walk(SRC_DIR);
  return results;
}
