import { cn } from "@/lib/utils"

type NoiseOverlayProps = {
    className?: string
    intensity?: number // Opacité de 0 à 100
    blendMode?: React.CSSProperties["mixBlendMode"]
    grainSize?: number // valeur entre 0.01 et 1 typiquement
  }
  
  export default function NoiseOverlay({
    className,
    intensity = 5,
    blendMode = "soft-light",
    grainSize = 0.8,
  }: NoiseOverlayProps) {
    const encodedSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <filter id="n">
          <feTurbulence type="fractalNoise" baseFrequency="${grainSize}" numOctaves="3" />
        </filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    `)
  
    return (
      <div
        className={cn(
          "absolute inset-0 pointer-events-none bg-repeat",
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodedSvg}")`,
          opacity: intensity / 100,
          mixBlendMode: blendMode,
        }}
      />
    )
  }
  