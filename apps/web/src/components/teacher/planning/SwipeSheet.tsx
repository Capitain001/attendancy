"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

export type SwipeSheetSnapPoint = "closed" | "peek" | "expanded"

interface SwipeSheetProps {
  children: ReactNode
  value: SwipeSheetSnapPoint
  onValueChange: (value: SwipeSheetSnapPoint) => void
  className?: string
  /** Hauteur visible en mode aperçu */
  peekHeight?: number
  /** Distance entre le haut du sheet et le haut de l'écran quand il est ouvert */
  expandedOffset?: number
  /** Ferme le sheet au clic sur l'overlay (mode expanded uniquement) */
  closeOnOverlayClick?: boolean
}

const SWIPE_THRESHOLD = 80
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

export function SwipeSheet({
  children,
  value,
  onValueChange,
  className,
  peekHeight = 120,
  expandedOffset = 80,
  closeOnOverlayClick = true,
}: SwipeSheetProps) {
  const viewportHeight = useViewportHeight()

  const snapPoints: Record<SwipeSheetSnapPoint, number> = {
    closed: viewportHeight,
    peek: viewportHeight - peekHeight,
    expanded: expandedOffset,
  }

  const getNextState = useCallback(
    (offset: number, velocity: number): SwipeSheetSnapPoint => {
      const isSwipeUp =
        offset < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD
      const isSwipeDown =
        offset > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD

      if (isSwipeUp) {
        return value === "closed" ? "peek" : "expanded"
      }

      if (isSwipeDown) {
        return value === "expanded" ? "peek" : "closed"
      }

      return value
    },
    [value],
  )

  return (
    <>
      <AnimatePresence>
        {value === "expanded" && (
          <motion.div
            key="swipe-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => closeOnOverlayClick && onValueChange("closed")}
            className="fixed inset-0 z-40 bg-black/40"
          />
        )}
      </AnimatePresence>

      <motion.div
        drag="y"
        dragElastic={0.1}
        dragConstraints={{ top: expandedOffset, bottom: viewportHeight }}
        animate={{ y: snapPoints[value] }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        onDragEnd={(_, info) =>
          onValueChange(getNextState(info.offset.y, info.velocity.y))
        }
        role="dialog"
        aria-expanded={value !== "closed"}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex h-[100dvh] flex-col rounded-t-3xl bg-card shadow-2xl",
          className,
        )}
      >
        {/* Handle — tap pour toggle, drag pour suivre le doigt */}
        <button
          type="button"
          onClick={() =>
            onValueChange(value === "expanded" ? "closed" : "expanded")
          }
          className="flex h-8 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
          aria-label={value === "expanded" ? "Réduire" : "Agrandir"}
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </button>

        <div className="min-h-0 flex-1 overflow-hidden overscroll-contain">
          {children}
        </div>
      </motion.div>
    </>
  )
}