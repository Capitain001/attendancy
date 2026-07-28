const path = require("node:path");
const { generateCollection } = require("../src/lib/svg");

// ─── Déclaration des collections ───────────────────────────────────────────
// Pour ajouter un nouveau jeu de SVG (ex: "logos"), ajoute une entrée ici.
// `mode` détermine le comportement de dimensionnement :
//  - "icon"         → carré, `size` (défaut 24), perd son ratio natif
//  - "illustration" → garde son viewBox natif (ratio préservé), pas de
//                      taille par défaut imposée

const COLLECTIONS = [
  {
    key: "resource",
    label: "icônes",
    mode: "icon",
    fileName: "icons",
    sourceDir: path.resolve("public/assets/resources"),
    outputDir: path.resolve("src/components/icons/generated"),
    componentPrefix: "Icon",
    mapName: "RESOURCE_ICONS",
    typeName: "ResourceIconName",
  },
  {
    key: "illustration",
    label: "illustrations",
    mode: "illustration",
    fileName: "illustrations",
    sourceDir: path.resolve("public/assets/illustrations"),
    outputDir: path.resolve("src/components/illustrations/generated"),
    componentPrefix: "Illustration",
    mapName: "RESOURCE_ILLUSTRATIONS",
    typeName: "ResourceIllustrationName",
  },
];

COLLECTIONS.forEach(generateCollection);