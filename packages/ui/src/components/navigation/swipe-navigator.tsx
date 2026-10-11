"use client"

import { useCallback, useRef, type ReactNode } from "react"
import { motion, type PanInfo } from "framer-motion"

import { cn } from "@ui/lib/utils"

interface SwipeNavigatorProps {
  panels: ReactNode[]
  value: number
  onValueChange: (index: number) => void
  className?: string
  hint?: ReactNode
}

const SWIPE_THRESHOLD = 100
const VELOCITY_THRESHOLD = 500

export function SwipeNavigator({
  panels,
  value,
  onValueChange,
  className,
  hint,
}: SwipeNavigatorProps) {
  const lastIndex = panels.length - 1
  const containerRef = useRef<HTMLDivElement>(null)

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
      onValueChange(value)
    },
    [value, lastIndex, onValueChange],
  )

  // Pourcentage de la hauteur PROPRE du motion.div (N panneaux empilés).
  // Ne dépend que des props → identique SSR/client, jamais de mesure async.
  const translateYPercent = -(value / panels.length) * 100

  return (
    <div
      ref={containerRef}
      className={cn("relative h-svh w-full overflow-hidden", className)}
    >
      <motion.div
        drag="y"
        dragElastic={0.15}
        dragConstraints={containerRef}
        animate={{ y: `${translateYPercent}%` }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        onDragEnd={handleDragEnd}
        className="flex flex-col"
        style={{ height: `${panels.length * 100}svh`, touchAction: "none" }}
      >
        {panels.map((panel, index) => (
          <section key={index} className="relative flex h-svh w-full shrink-0 flex-col">
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