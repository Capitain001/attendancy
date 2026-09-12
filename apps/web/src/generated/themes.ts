// Fichier généré par scripts/generate/themes/themes.ts — ne pas éditer à la main.
// Pour ajouter un thème : créer styles/themes/mon-theme.css avec un
// sélecteur ".theme-mon-theme { ... }", puis relancer ce script.

export type ThemeDefinition = { name: string; label: string };

export const DEFAULT_THEME = "default";

export const themes: ThemeDefinition[] = [
  { name: "default", label: "Default" },
  { name: "claude", label: "Claude" },
  { name: "lime", label: "Lime" },
];

export const THEME_NAMES = themes.map((t) => t.name);
