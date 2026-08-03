// components/ui/BackgroundPattern.tsx

import { cn } from "@/lib/utils"

/**
 * 🔹 Liste des patterns 
 */
export const PATTERNS = [
  "pattern-noise",
  "pattern-cross",
  "pattern-dots",
  "pattern-grid",
] as const;
/**
 * 🔹 Type dérivé automatiquement
 */
export type PatternVariant = (typeof PATTERNS)[number]


type BackgroundPatternProps = {
  pattern?: PatternVariant;
  className?: string;
  opacity?: number;
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
}: BackgroundPatternProps) {
  return (
    <div
      className={cn(
        "pattern dark:invert",
        pattern,
        className
      )}
      style={
        opacity !== undefined
          ? ({
              "--pattern-opacity": opacity,
            } as React.CSSProperties)
          : undefined
      }
    />
  );
}


