// src/components/scroll-navigator.tsx
// Composant serveur : aucun JS client, le swipe vertical est géré par le navigateur (scroll-snap)

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface ScrollNavigatorProps {
  panels: ReactNode[]
  className?: string
}

export function ScrollNavigator({ panels, className }: ScrollNavigatorProps) {
  return (
    // Conteneur scrollable : prend la hauteur du parent (h-full), pas celle de l'écran,
    // pour ne pas déborder sous le header
    <div
      className={cn(
        "h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-contain",
        className,
      )}
    >
      {panels.map((panel, index) => (
        // h-full : chaque panneau fait exactement la hauteur visible du conteneur
        // snap-always empêche de sauter plusieurs panneaux sur un swipe rapide
        <section
          key={index}
          className="relative flex h-full w-full shrink-0 snap-start snap-always flex-col"
        >
          {panel}
        </section>
      ))}
    </div>
  )
}