import type { ReactNode } from "react";

/** Un segment de l'anneau = un onglet cliquable. */
export interface RingSegment {
  /** Identifiant unique de l'onglet. */
  value: string;
  /** Couleur de l'arc (toute valeur CSS : hex, var, oklch…). */
  color: string;
  /** Icône affichée sur l'arc (toujours rendue droite). */
  icon?: ReactNode;
  /** Libellé accessible (title / aria-label). */
  label: string;
  /**
   * Poids relatif → longueur de l'arc (effet « jauge proportionnelle »).
   * Omis partout = arcs de longueur égale.
   */
  weight?: number;
  disabled?: boolean;
}

/** Contenu central : noeud statique ou render-prop recevant le segment actif. */
export type RingCenterRenderProp = (active: RingSegment | null) => ReactNode;

export interface AnalyticRingProps {
  segments: RingSegment[];
  /** Valeur contrôlée de l'onglet actif. */
  value?: string;
  /** Valeur initiale (mode non-contrôlé). Défaut : premier segment. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  /** Diamètre total en px. Défaut 320. */
  size?: number;
  /** Épaisseur des arcs en px. Défaut 26. */
  thickness?: number;
  /** Marge entre le bord du SVG et l'anneau. Défaut 6. */
  gap?: number;
  /** Espace angulaire entre deux arcs (degrés). Défaut 12. */
  segmentGap?: number;
  /** Côté (px) de la boîte carrée de l'icône sur l'arc. Défaut ≈ thickness * 0.7. */
  iconBox?: number;

  /** Contenu central — l'appelant décide quoi afficher. */
  children?: ReactNode | RingCenterRenderProp;
  className?: string;
}
