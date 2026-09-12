// apps/web/src/hooks/use-theme-selector.ts
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { DEFAULT_THEME, themes } from "@/config/themes";
import { useThemeConfig } from "@/components/theme/ActiveTheme";
import { getThemeColor } from "@/components/theme/utils";


export type ThemeOption = {
  name: string;
  label: string;
  /** Valeur calculée de --primary pour ce thème, dans le mode clair/sombre courant */
  color: string;
  isActive: boolean;
  select: () => void;
};

export type UseThemeSelectorResult = {
  /** false tant que le composant n'est pas hydraté (couleurs pas encore lisibles) */
  mounted: boolean;
  /** Un item par thème du registre — libre à l'UI de les mapper en cercle, carré, ligne... */
  options: ThemeOption[];
  activeTheme: string;
  isDark: boolean;
  setMode: (mode: "light" | "dark" | "system") => void;
  toggleMode: () => void;
  /** Revient au thème + mode par défaut */
  reset: () => void;
};

/**
 * Toute la logique métier du sélecteur de thème : lecture des couleurs,
 * état actif, changement de mode clair/sombre, reset.
 * Ne rend rien — à consommer par n'importe quel composant UI.
 */
export function useThemeSelector(): UseThemeSelectorResult {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const { setTheme, resolvedTheme: mode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolvedMode = mode === "dark" ? "dark" : "light";
    const next: Record<string, string> = {};
    themes.forEach((theme) => {
      next[theme.name] = getThemeColor(theme.name, resolvedMode);
    });
    setColors(next);
  }, [mounted, mode]);

  const isDark = mode === "dark";

  const options: ThemeOption[] = themes.map((theme) => ({
    name: theme.name,
    label: theme.label,
    color: colors[theme.name] ?? "transparent",
    isActive: activeTheme === theme.name,
    select: () => setActiveTheme(theme.name),
  }));

  return {
    mounted,
    options,
    activeTheme,
    isDark,
    setMode: (m) => setTheme(m),
    toggleMode: () => setTheme(isDark ? "light" : "dark"),
    reset: () => {
      setActiveTheme(DEFAULT_THEME);
      setTheme("system");
    },
  };
}