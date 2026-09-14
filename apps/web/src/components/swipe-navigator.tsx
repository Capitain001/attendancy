"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { motion, type PanInfo } from "framer-motion"

import { cn } from "@/lib/utils"

export type SwipeNavState = "main" | "secondary"

interface SwipeNavigatorProps {
  /** Écran du haut, affiché par défaut */
  main: ReactNode
  /** Écran du bas, révélé par swipe ↑ */
  secondary: ReactNode
  value: SwipeNavState
  onValueChange: (value: SwipeNavState) => void
  className?: string
  /**
   * Contenu optionnel affiché en bas de l'écran principal pour indiquer
   * qu'on peut glisser vers le haut (ex: chevron + texte).
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
  main,
  secondary,
  value,
  onValueChange,
  className,
  hint,
}: SwipeNavigatorProps) {
  const viewportHeight = useViewportHeight()

  // main → y = 0 (rien caché) · secondary → y = -viewportHeight (translaté vers le haut)
  const snapY = value === "main" ? 0 : -viewportHeight

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info

      const isSwipeUp =
        offset.y < -SWIPE_THRESHOLD || velocity.y < -VELOCITY_THRESHOLD
      const isSwipeDown =
        offset.y > SWIPE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD

      if (isSwipeUp && value === "main") {
        onValueChange("secondary")
        return
      }

      if (isSwipeDown && value === "secondary") {
        onValueChange("main")
        return
      }

      // Pas assez de mouvement → on reste sur l'état courant
      onValueChange(value)
    },
    [value, onValueChange],
  )

  return (
    <div className={cn("relative h-dvh w-full overflow-hidden", className)}>
      <motion.div
        drag="y"
        dragElastic={0.15}
        dragConstraints={{ top: -viewportHeight, bottom: 0 }}
        animate={{ y: snapY }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        onDragEnd={handleDragEnd}
        className="flex flex-col"
        style={{ height: viewportHeight * 2, touchAction: "none" }}
      >
        <section className="relative flex h-dvh w-full shrink-0 flex-col">
          {main}

          {value === "main" && hint && (
            <button
              type="button"
              onClick={() => onValueChange("secondary")}
              className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-5 pt-4 text-muted-foreground"
              aria-label="Voir l'écran suivant"
            >
              {hint}
            </button>
          )}
        </section>

        <section className="h-dvh w-full shrink-0">{secondary}</section>
      </motion.div>
    </div>
  )
}