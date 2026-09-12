"use client";

/**
 * Lit la valeur calculée de --primary pour un thème + mode donnés, en
 * appliquant temporairement la classe .theme-{name} (et .dark si besoin)
 * sur un élément invisible. Résultat mis en cache par (thème, mode).
 *
 * Avantage : le sélecteur de thème n'a jamais besoin de connaître les
 * couleurs à l'avance — la couleur affichée dans le swatch vient
 * directement du fichier CSS du thème, qui reste la seule source de vérité.
 */

const cache = new Map<string, string>();

export function getThemeColor(
  themeName: string,
  mode: "light" | "dark" = "light",
): string {
  const cacheKey = `${themeName}-${mode}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === "undefined") return "transparent";

  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.width = "0";
  probe.style.height = "0";

  if (themeName !== "default") {
    probe.classList.add(`theme-${themeName}`);
  }
  if (mode === "dark") {
    probe.classList.add("dark");
  }

  document.body.appendChild(probe);
  const value = getComputedStyle(probe).getPropertyValue("--primary").trim();
  document.body.removeChild(probe);

  const resolved = value || "transparent";
  cache.set(cacheKey, resolved);
  return resolved;
}

export function clearThemeColorCache() {
  cache.clear();
}