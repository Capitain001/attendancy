const fs = require("node:fs");
const path = require("node:path");

const ICONS_DIR = path.resolve("public/assets/resources");
const OUTPUT_DIR = path.resolve("src/components/icons/generated");
const ICONS_OUTPUT = path.join(OUTPUT_DIR, "icons.tsx");
const INDEX_OUTPUT = path.join(OUTPUT_DIR, "index.ts");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs
  .readdirSync(ICONS_DIR)
  .filter((file) => file.endsWith(".svg"))
  .sort((a, b) => a.localeCompare(b, "en"));

if (files.length === 0) {
  console.warn("⚠️  Aucun fichier .svg trouvé dans", ICONS_DIR);
  process.exit(0);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toKebabCase(input) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function normalizeIconName(fileName) {
  return toKebabCase(fileName.replace(/\.svg$/i, ""));
}

function toPascalCase(kebab) {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function sanitizeSvg(raw) {
  return raw
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/xmlns:xlink=/g, "xmlnsXlink=")
    .replace(/xlink:href=/g, "xlinkHref=")
    .replace(/xml:space=/g, "xmlSpace=")
    .replace(/\bclass=/g, "className=")
    .replace(/\bstroke-width=/g, "strokeWidth=")
    .replace(/\bstroke-linecap=/g, "strokeLinecap=")
    .replace(/\bstroke-linejoin=/g, "strokeLinejoin=")
    .replace(/\bstroke-miterlimit=/g, "strokeMiterlimit=")
    .replace(/\bfill-rule=/g, "fillRule=")
    .replace(/\bclip-rule=/g, "clipRule=")
    .replace(/\bclip-path=/g, "clipPath=")
    .replace(/\bstop-color=/g, "stopColor=")
    .replace(/\bstop-opacity=/g, "stopOpacity=")
    .replace(/\bfont-size=/g, "fontSize=")
    .replace(/\bfont-family=/g, "fontFamily=")
    .replace(/\bfont-weight=/g, "fontWeight=")
    .replace(/\btext-anchor=/g, "textAnchor=")
    .replace(/<svg([^>]*)>/, (_, attrs) => {
      const cleaned = attrs
        .replace(/\s*width="[^"]*"/g, "")
        .replace(/\s*height="[^"]*"/g, "")
        .replace(/\s*version="[^"]*"/g, "")
        .replace(/\s*id="[^"]*"/g, "")
        .replace(/\s*xmlns:xlink="[^"]*"/g, "")
        .replace(/\s*xmlnsXlink="[^"]*"/g, "");
      return `<svg${cleaned} width={size} height={size} className={className} aria-hidden="true" {...props}>`;
    })
    .trim();
}

// ─── Génération de icons.tsx ─────────────────────────────────────────────────

const iconComponents = files.map((file) => {
  const normalizedName = normalizeIconName(file);
  const componentName = `Icon${toPascalCase(normalizedName)}`;
  const rawSvg = fs.readFileSync(path.join(ICONS_DIR, file), "utf8");
  const jsxSvg = sanitizeSvg(rawSvg);
  return { componentName, normalizedName, jsxSvg };
});

const iconsFileContent = `/* eslint-disable */
/* auto-generated — do not edit manually */
/* source: public/assets/resources/ */

import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
};

${iconComponents
  .map(
    ({ componentName, jsxSvg }) => `
export function ${componentName}({ size = 24, className, ...props }: Props) {
  return (
    ${jsxSvg}
  );
}`
  )
  .join("\n")}
`;

fs.writeFileSync(ICONS_OUTPUT, iconsFileContent, "utf8");

iconComponents.forEach(({ componentName }) => {
  console.log(`  ✔ ${componentName}`);
});

// ─── Génération de index.ts ──────────────────────────────────────────────────

const indexContent = `/* eslint-disable */
/* auto-generated — do not edit manually */

export {
${iconComponents.map(({ componentName }) => `  ${componentName},`).join("\n")}
} from "./icons";

import type { FC, SVGProps } from "react";
import {
${iconComponents.map(({ componentName }) => `  ${componentName},`).join("\n")}
} from "./icons";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; className?: string };

export const RESOURCE_ICONS = {
${iconComponents.map(({ componentName, normalizedName }) => `  "${normalizedName}": ${componentName},`).join("\n")}
} as const satisfies Record<string, FC<IconProps>>;

export type ResourceIconName = keyof typeof RESOURCE_ICONS;
`;

fs.writeFileSync(INDEX_OUTPUT, indexContent, "utf8");

console.log(`\n✅ ${files.length} icônes générées → ${path.relative(process.cwd(), OUTPUT_DIR)}`);
console.log(`   📄 icons.tsx  — ${iconComponents.length} composants`);
console.log(`   📄 index.ts   — exports + RESOURCE_ICONS map`);