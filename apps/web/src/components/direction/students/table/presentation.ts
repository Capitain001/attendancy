import type { ImportanceTier } from "./types";

/**
 * Traduction du niveau d'importance d'une colonne en style concret.
 * Seul endroit du code qui décide "à quoi ressemble" un tier — pour ajuster
 * la hiérarchie visuelle globale, c'est ici (et uniquement ici) qu'on touche.
 */
export const TIER_HEADER_CLASS: Record<ImportanceTier, string> = {
  critical: "text-[11.5px] font-semibold text-foreground",
  primary: "text-[11.5px] font-medium text-foreground",
  secondary: "text-[11px] font-medium text-foreground/70",
  tertiary: "text-[10.5px] font-medium text-muted-foreground/80",
};

export const TIER_CELL_CLASS: Record<ImportanceTier, string> = {
  critical: "text-[12px] font-semibold",
  primary: "text-[11.5px] font-medium text-foreground",
  secondary: "text-[11px] text-foreground/75",
  tertiary: "text-[10.5px] text-muted-foreground",
};

/** Ligne de séparation uniforme sous l'en-tête. */
export const HEADER_BORDER_CLASS = "border-b border-b-border";

/** Code couleur du taux de présence — porte à lui seul l'essentiel de la lecture rapide. */
export function presenceTone(rate: number | null): { pill: string; dot: string } {
  if (rate === null) return { pill: "bg-muted text-muted-foreground/70", dot: "bg-muted-foreground/30" };
  if (rate >= 90) return { pill: "bg-emerald-500/12 text-emerald-700", dot: "bg-emerald-500" };
  if (rate >= 75) return { pill: "bg-amber-500/12 text-amber-700", dot: "bg-amber-500" };
  return { pill: "bg-red-500/12 text-red-700", dot: "bg-red-500" };
}
