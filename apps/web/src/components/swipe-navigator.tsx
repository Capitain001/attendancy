"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { motion, type PanInfo } from "framer-motion"

import { cn } from "@/lib/utils"

interface SwipeNavigatorProps {
  /** Écrans empilés verticalement, dans l'ordre de navigation. */
  panels: ReactNode[]
  /** Index du panneau actif. */
  value: number
  onValueChange: (index: number) => void
  className?: string
  /**
   * Contenu affiché en bas du panneau actif pour indiquer qu'on peut
   * glisser vers le haut. Masqué automatiquement sur le dernier panneau.
   */
  hint?: ReactNode
}

const SWIPE_THRESHOLD = 100
const VELOCITY_THRESHOLD = 500

function useViewportHeight() {
  const [height, setHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 0,
  )

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return height
}

export function SwipeNavigator({
  panels,
  value,
  onValueChange,
  className,
  hint,
}: SwipeNavigatorProps) {
  const viewportHeight = useViewportHeight()
  const lastIndex = panels.length - 1

  const snapY = -value * viewportHeight

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info

      const isSwipeUp =
        offset.y < -SWIPE_THRESHOLD || velocity.y < -VELOCITY_THRESHOLD
      const isSwipeDown =
        offset.y > SWIPE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD

      if (isSwipeUp && value < lastIndex) {
        onValueChange(value + 1)
        return
      }

      if (isSwipeDown && value > 0) {
        onValueChange(value - 1)
        return
      }

      // Pas assez de mouvement, ou déjà à une extrémité → on reste en place
      onValueChange(value)
    },
    [value, lastIndex, onValueChange],
  )

  return (
    <div className={cn("relative h-dvh w-full overflow-hidden", className)}>
      <motion.div
        drag="y"
        dragElastic={0.15}
        dragConstraints={{ top: -lastIndex * viewportHeight, bottom: 0 }}
        animate={{ y: snapY }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        onDragEnd={handleDragEnd}
        className="flex flex-col"
        style={{ height: panels.length * viewportHeight, touchAction: "none" }}
      >
        {panels.map((panel, index) => (
          <section key={index} className="relative flex h-dvh w-full shrink-0 flex-col">
            {panel}

            {value === index && index < lastIndex && hint && (
              <button
                type="button"
                onClick={() => onValueChange(index + 1)}
                className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-5 pt-4 text-muted-foreground"
                aria-label="Voir l'écran suivant"
              >
                {hint}
              </button>
            )}
          </section>
        ))}
      </motion.div>
    </div>
  )
}