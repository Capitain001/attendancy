const fs = require("node:fs");
const path = require("node:path");

// ─── Naming helpers ─────────────────────────────────────────────────────────

function toKebabCase(input) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function normalizeName(fileName) {
  return toKebabCase(fileName.replace(/\.svg$/i, ""));
}

function toPascalCase(kebab) {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

// ─── SVG attribute sanitization (commune à tous les modes) ────────────────

function sanitizeSvgAttrs(raw) {
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
    .replace(/\bstroke-opacity=/g, "strokeOpacity=")
    .replace(/\bfont-size=/g, "fontSize=")
    .replace(/\bfont-family=/g, "fontFamily=")
    .replace(/\bfont-weight=/g, "fontWeight=")
    .replace(/\btext-anchor=/g, "textAnchor=")
    // Proprietes SVG obsoletes (Illustrator) sans equivalent React/CSS
    .replace(/\s*enable-background="[^"]*"/g, "")
    .replace(/\bstyle="([^"]*)"/g, (_, cssString) => {
      // Convertit style="fill:#fff;opacity:1;" -> style={{fill:"#fff",opacity:1}}
      const entries = cssString
        .split(";")
        .map((decl) => decl.trim())
        .filter(Boolean)
        // Filtre les props CSS sans equivalent valide dans React
        .filter((decl) => !/^enable-background\s*:/i.test(decl))
        .map((decl) => {
          const colonIdx = decl.indexOf(":");
          const prop = decl.slice(0, colonIdx).trim();
          const value = decl.slice(colonIdx + 1).trim();
          // kebab-case -> camelCase
          const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          // Valeur numerique pure sans guillemets, sinon string
          const jsValue = /^-?\d+(\.\d+)?$/.test(value) ? value : `"${value}"`;
          return `${camelProp}:${jsValue}`;
        });
      // Omet style={{}} si toutes les declarations ont ete filtrees
      return entries.length > 0 ? `style={{${entries.join(",")}}}` : "";
    })
    .trim();
}

function stripIntrinsicAttrs(attrs) {
  return attrs
    .replace(/\s*width="[^"]*"/g, "")
    .replace(/\s*height="[^"]*"/g, "")
    .replace(/\s*version="[^"]*"/g, "")
    .replace(/\s*id="[^"]*"/g, "")
    .replace(/\s*xmlns:xlink="[^"]*"/g, "")
    .replace(/\s*xmlnsXlink="[^"]*"/g, "");
}

// ─── Modes ──────────────────────────────────────────────────────────────────
// Chaque mode définit :
//  - comment l'ouverture <svg> est réécrite (props injectées)
//  - le type Props TS généré
//  - la signature de la fonction composant générée
//
// "icon"         : carré, taille pilotée par `size` (défaut 24), perd son
//                  ratio intrinsèque — adapté aux pictogrammes UI.
// "illustration" : conserve son `viewBox` natif (donc son ratio), pas de
//                  `size` forcé. `width`/`height` restent optionnels et ne
//                  sont injectés que si explicitement fournis par le
//                  consommateur, sinon le SVG garde ses dimensions inline.

const MODES = {
  icon: {
    propsType: `type Props = SVGProps<SVGSVGElement> & {
  size?: number;
  className?: string;
};`,
    functionSignature: ({ componentName }) =>
      `export function ${componentName}({ size = 24, className, ...props }: Props) {`,
    rewriteSvgOpenTag: (attrs) =>
      `<svg${stripIntrinsicAttrs(attrs)} width={size} height={size} className={className} aria-hidden="true" {...props}>`,
  },
  illustration: {
    propsType: `type Props = SVGProps<SVGSVGElement> & {
  className?: string;
};`,
    functionSignature: ({ componentName }) =>
      `export function ${componentName}({ className, ...props }: Props) {`,
    // On garde le viewBox (donc le ratio natif) ; width/height ne sont PAS
    // forcés à une valeur par défaut — seuls ceux passés explicitement via
    // {...props} s'appliquent, sinon le SVG suit son viewBox / le CSS ambiant.
    rewriteSvgOpenTag: (attrs) =>
      `<svg${stripIntrinsicAttrs(attrs)} className={className} aria-hidden="true" {...props}>`,
  },
};

function sanitizeSvg(raw, mode) {
  const { rewriteSvgOpenTag } = MODES[mode];
  return sanitizeSvgAttrs(raw).replace(/<svg([^>]*)>/, (_, attrs) => rewriteSvgOpenTag(attrs));
}

// ─── Génération pour une collection ────────────────────────────────────────

function generateCollection(collection) {
  const { key, label, mode, sourceDir, outputDir, componentPrefix, mapName, typeName } = collection;

  if (!MODES[mode]) {
    throw new Error(`Mode inconnu "${mode}" pour la collection "${key}". Modes valides: ${Object.keys(MODES).join(", ")}`);
  }

  if (!fs.existsSync(sourceDir)) {
    console.warn(`⚠️  Dossier introuvable, collection "${key}" ignorée :`, sourceDir);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => file.endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b, "en"));

  if (files.length === 0) {
    console.warn(`⚠️  Aucun fichier .svg trouvé dans`, sourceDir);
    return;
  }

  const componentsOutput = path.join(outputDir, `${collection.fileName}.tsx`);
  const indexOutput = path.join(outputDir, "index.ts");
  const { propsType, functionSignature } = MODES[mode];

  const components = files.map((file) => {
    const normalizedName = normalizeName(file);
    const componentName = `${componentPrefix}${toPascalCase(normalizedName)}`;
    const rawSvg = fs.readFileSync(path.join(sourceDir, file), "utf8");
    const jsxSvg = sanitizeSvg(rawSvg, mode);
    return { componentName, normalizedName, jsxSvg };
  });

  const componentsFileContent = `/* eslint-disable */
/* auto-generated — do not edit manually */
/* source: ${path.relative(process.cwd(), sourceDir)}/ */

import type { SVGProps } from "react";

${propsType}

${components
  .map(
    ({ componentName, jsxSvg }) => `
${functionSignature({ componentName })}
  return (
    ${jsxSvg}
  );
}`
  )
  .join("\n")}
`;

  fs.writeFileSync(componentsOutput, componentsFileContent, "utf8");

  console.log(`\n📦 Collection "${key}" (${label}) — mode "${mode}"`);
  components.forEach(({ componentName }) => {
    console.log(`  ✔ ${componentName}`);
  });

  const indexContent = `/* eslint-disable */
/* auto-generated — do not edit manually */

export {
${components.map(({ componentName }) => `  ${componentName},`).join("\n")}
} from "./${collection.fileName}";

import type { FC, SVGProps } from "react";
import {
${components.map(({ componentName }) => `  ${componentName},`).join("\n")}
} from "./${collection.fileName}";

type ComponentProps = SVGProps<SVGSVGElement>;

export const ${mapName} = {
${components.map(({ componentName, normalizedName }) => `  "${normalizedName}": ${componentName},`).join("\n")}
} as const satisfies Record<string, FC<ComponentProps>>;

export type ${typeName} = keyof typeof ${mapName};
`;

  fs.writeFileSync(indexOutput, indexContent, "utf8");

  console.log(`✅ ${files.length} ${label} générées → ${path.relative(process.cwd(), outputDir)}`);
  console.log(`   📄 ${collection.fileName}.tsx  — ${components.length} composants`);
  console.log(`   📄 index.ts   — exports + ${mapName} map`);
}

module.exports = { generateCollection, MODES };