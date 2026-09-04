// components/ui/BackgroundPattern.tsx
import { useId } from "react";
import { cn } from "@/lib/utils";
import { NoiseFilter } from "./NoiseFilter";

export { NoiseFilterDefs } from "./NoiseFilter";

export const PATTERNS = [
  "pattern-noise",
  "pattern-cross",
  "pattern-dots",
  "pattern-grid",
  "pattern-noise-svg",
] as const;

export type PatternVariant = (typeof PATTERNS)[number];



type BackgroundPatternProps = {
  pattern?: PatternVariant;
  className?: string;
  style?: React.CSSProperties;
  opacity?: number;
  /** pattern-noise-svg uniquement */
  baseFrequency?: number;
  /** pattern-noise-svg uniquement */
  numOctaves?: number;
  /**
   * pattern-noise-svg uniquement.
   * true = réutilise le filtre global #noise-filter-shared
   * (nécessite <NoiseFilterDefs /> monté une fois dans le layout).
   */
  shared?: boolean;
  /** pattern-noise-svg uniquement. Aligne le comportement dark:invert des autres patterns. */
  invertOnDark?: boolean;
};

/**
 * BackgroundPattern
 *
 * ⚠️Le parent doit être `relative` , `overflow-hidden`
 *
 * Exemple  :
 *
 * <div className="relative">
 *   <BackgroundPattern pattern="bg-pattern-dots"  className="opacity-30" />
 * </div>
 *
 * 
 *  Ici, le pattern ne s'inversera PAS en mode sombre 
 *  <BackgroundPattern  pattern="bg-pattern-dots" className="dark:invert-0 opacity-20"/>
 * 
 */

export function BackgroundPattern({
  pattern = "pattern-cross",
  opacity,
  className,
  style,
  baseFrequency = 0.65,
  numOctaves = 3,
  shared = false,
  invertOnDark = true,
}: BackgroundPatternProps) {
  const filterId = useId();

  if (pattern === "pattern-noise-svg") {
    const effectiveFilterId = shared ? "noise-filter-shared" : `noise-filter-${filterId}`;

    return (
      <svg
        className={cn(
          "absolute inset-0 pointer-events-none select-none",
          invertOnDark && "dark:invert",
          className
        )}
        style={style}
        aria-hidden="true"
      >
        {!shared && (
          <defs>
            <NoiseFilter id={effectiveFilterId} baseFrequency={baseFrequency} numOctaves={numOctaves} />
          </defs>
        )}
        <rect
          width="100%"
          height="100%"
          filter={`url(#${effectiveFilterId})`}
          opacity={opacity ?? 0.3}
        />
      </svg>
    );
  }

  // Patterns image existants — comportement inchangé
  return (
    <div
      className={cn("pattern dark:invert", pattern, className)}
      style={{
        ...(opacity !== undefined
          ? ({ "--pattern-opacity": opacity } as React.CSSProperties)
          : undefined),
        ...style,
      }}
    />
  );
}


