/**
 * Géométrie de l'anneau : répartit N arcs sur un cercle (départ en haut, sens
 * horaire), longueur proportionnelle au poids. Produit pour chaque segment un
 * path SVG + le point d'ancrage de l'icône, calé près du début de l'arc pour
 * l'effet « horloge » de la référence.
 */

export interface ArcGeometry {
  /** `d` du <path>. */
  path: string;
  /** Ancrage icône (proche du début de l'arc). */
  iconX: number;
  iconY: number;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function computeArcs(
  weights: number[],
  size: number,
  thickness: number,
  gap: number,
  segmentGap: number
): ArcGeometry[] {
  const count = weights.length;
  if (count === 0) return [];

  const safe = weights.map((w) => (w > 0 ? w : 0));
  const totalWeight = safe.reduce((s, w) => s + w, 0) || count;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - thickness / 2 - gap;

  const totalGap = segmentGap * count;
  const usableDeg = 360 - totalGap;

  let cursor = -90; // haut
  return safe.map((w) => {
    const weight = w || totalWeight / count;
    const arcDeg = usableDeg * (weight / totalWeight);

    const start = cursor + segmentGap / 2;
    const end = start + arcDeg;
    cursor += arcDeg + segmentGap;

    const largeArc = arcDeg > 180 ? 1 : 0;
    const p0 = polar(cx, cy, r, start);
    const p1 = polar(cx, cy, r, end);

    // Icône centrée sur le cap arrondi du DÉBUT : le cap est un demi-disque
    // centré sur p0, son centre angulaire ≈ (thickness/2)/r radians. On s'y cale
    // (et on borne à arcDeg/2 pour les arcs très courts) → icône collée au début.
    const capDeg = ((thickness / 4) / r) * (180 / Math.PI);
    const iconDeg = Math.min(capDeg, arcDeg / 2);
    const icon = polar(cx, cy, r, start + iconDeg);

    return {
      path: `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      iconX: icon.x,
      iconY: icon.y,
    };
  });
}
