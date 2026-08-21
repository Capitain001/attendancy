// components/ui/NoiseFilter.tsx
import { CSSProperties } from "react";

type NoiseFilterProps = {
  id: string;
  baseFrequency?: number;
  numOctaves?: number;
};

/**
 * Définition brute du filtre de bruit — à placer dans un <defs>.
 * Ne rend rien de visible seule ; réutilisée par NoiseFilterDefs (mode partagé)
 * et par BackgroundPattern (mode par-instance).
 */
export function NoiseFilter({
  id,
  baseFrequency = 0.65,
  numOctaves = 3,
}: NoiseFilterProps) {
  return (
    <filter id={id}>
      <feTurbulence
        type="fractalNoise"
        baseFrequency={baseFrequency}
        numOctaves={numOctaves}
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="linear" slope={0.46} />
        <feFuncG type="linear" slope={0.46} />
        <feFuncB type="linear" slope={0.46} />
        <feFuncA type="linear" slope={0.56} />
      </feComponentTransfer>
      <feComponentTransfer>
        <feFuncR type="linear" slope={1.47} intercept={-0.23} />
        <feFuncG type="linear" slope={1.47} intercept={-0.23} />
        <feFuncB type="linear" slope={1.47} intercept={-0.23} />
      </feComponentTransfer>
    </filter>
  );
}

/**
 * À monter UNE SEULE FOIS (layout / _app) si tu utilises shared=true
 * sur <BackgroundPattern pattern="pattern-noise-svg" shared />.
 */
export function NoiseFilterDefs({
  baseFrequency = 0.65,
  numOctaves = 3,
}: {
  baseFrequency?: number;
  numOctaves?: number;
}) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" } as CSSProperties} aria-hidden="true">
      <defs>
        <NoiseFilter id="noise-filter-shared" baseFrequency={baseFrequency} numOctaves={numOctaves} />
      </defs>
    </svg>
  );
}