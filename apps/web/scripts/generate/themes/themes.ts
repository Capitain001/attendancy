#!/usr/bin/env node
/**
 * apps/web/scripts/generate/themes/themes.ts
 *
 * Scanne apps/web/src/styles/themes/*.css et génère automatiquement :
 *   - apps/web/src/styles/themes/index.css  (les @import)
 *   - apps/web/src/generated/themes.ts      (le tableau des thèmes)
 *
 * Chaque fichier de thème doit contenir un sélecteur .theme-<name> :
 *
 *   .theme-claude {
 *     --color-primary: #d97757;
 *   }
 *
 * Le nom du thème est déduit du sélecteur (.theme-claude -> "claude"),
 * pas du nom de fichier. Le label affiché est déduit automatiquement du nom
 * (claude -> "Claude", ocean-blue -> "Ocean Blue") — aucun commentaire requis.
 * Le fichier "default" (variables de :root, pas de fichier CSS dédié) est
 * toujours ajouté en premier.
 *
 * Usage : node --experimental-strip-types scripts/generate-themes.ts
 *    ou : tsx scripts/generate-themes.ts
 * À brancher sur "predev" / "prebuild" dans package.json pour que ce soit
 * automatique à chaque lancement.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface ThemeMeta {
  name: string;
  label: string;
}

const __dirname: string = dirname(fileURLToPath(import.meta.url));
// Depuis apps/web/scripts/generate/themes/themes.ts, on remonte jusqu'à apps/web
const THEMES_DIR: string = join(__dirname, "../../../src/styles/themes");
const GENERATED_DIR: string = join(__dirname, "../../../src/generated");
const GENERATED_FILE: string = join(GENERATED_DIR, "themes.ts");
const INDEX_CSS_FILE: string = join(THEMES_DIR, "index.css");

// Capture le nom depuis le sélecteur .theme-<name>.
const THEME_RE = /\.theme-([a-zA-Z0-9_-]+)/;

// "claude" -> "Claude", "ocean-blue" -> "Ocean Blue"
function toLabel(name: string): string {
  return name
    .split(/[-_]/)
    .map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function main(): void {
  const files: string[] = readdirSync(THEMES_DIR)
    .filter((f): boolean => f.endsWith(".css") && f !== "index.css")
    .sort();

  const themes: ThemeMeta[] = files.map((file): ThemeMeta => {
    const content: string = readFileSync(join(THEMES_DIR, file), "utf8");
    const match: RegExpMatchArray | null = content.match(THEME_RE);

    if (!match) {
      throw new Error(
        `${file} : sélecteur ".theme-<name>" introuvable dans le fichier.`,
      );
    }

    const name: string = match[1].trim();
    return { name, label: toLabel(name) };
  });

  // ── index.css ──────────────────────────────────────────────
  const indexCss: string = [
    "/* Fichier généré par scripts/generate-themes.ts — ne pas éditer à la main. */",
    "",
    ...files.map((f: string): string => `@import "./${f}";`),
    "",
  ].join("\n");
  writeFileSync(INDEX_CSS_FILE, indexCss);

  // ── themes.ts ──────────────────────────────────────────────
  const themesTs: string = [
    "// Fichier généré par scripts/generate/themes/themes.ts — ne pas éditer à la main.",
    "// Pour ajouter un thème : créer styles/themes/mon-theme.css avec un",
    '// sélecteur ".theme-mon-theme { ... }", puis relancer ce script.',
    "",
    "export type ThemeDefinition = { name: string; label: string };",
    "",
    'export const DEFAULT_THEME = "default";',
    "",
    "export const themes: ThemeDefinition[] = [",
    '  { name: "default", label: "Default" },',
    ...themes.map((t: ThemeMeta): string => `  { name: "${t.name}", label: "${t.label}" },`),
    "];",
    "",
    "export const THEME_NAMES = themes.map((t) => t.name);",
    "",
  ].join("\n");
  mkdirSync(GENERATED_DIR, { recursive: true });
  writeFileSync(GENERATED_FILE, themesTs);

  console.log(
    `✓ ${themes.length} thème(s) détecté(s) : ${themes.map((t: ThemeMeta): string => t.name).join(", ")}`,
  );
  console.log(`  → ${INDEX_CSS_FILE}`);
  console.log(`  → ${GENERATED_FILE}`);
}

main();