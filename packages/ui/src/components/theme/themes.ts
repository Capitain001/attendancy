export type ThemeDefinition = { name: string; label: string };

export const DEFAULT_THEME = "default";

export const themes: ThemeDefinition[] = [
  { name: "default", label: "Default" },
  { name: "claude", label: "Claude" },
  { name: "lime", label: "Lime" },
  { name: "teacher", label: "Teacher" },
];

export const THEME_NAMES = themes.map((t) => t.name);
