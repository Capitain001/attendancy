"use client"

import { motion, type PanInfo } from "framer-motion"
import { cn, truncateText } from "@/lib/utils"
import type { StackedCard } from "./types"

export interface NotificationCardProps {
  card: StackedCard
  totalCards: number
  truncateLength: number
  isTopCard: boolean
  onClick: () => void
  onDragStart?: () => void
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
}

export function NotificationCard({
  card,
  totalCards,
  truncateLength,
  isTopCard,
  onClick,
  onDragStart,
  onDragEnd,
}: NotificationCardProps) {
  const { stackPosition } = card

  return (
    <motion.div
      layoutId={`card-${card.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        top: stackPosition * 6,
        left: stackPosition * 6,
        zIndex: totalCards - stackPosition,
        rotate: (stackPosition - 1) * 2,
      }}
      exit={{ opacity: 0, scale: 0.9, x: -100 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-card p-3 text-left",
        "transition-colors duration-200",
        "absolute w-44 h-32",
        isTopCard && "cursor-grab active:cursor-grabbing"
      )}
      style={{ backgroundColor: card.color || undefined }}
    >

      <div className="flex h-full flex-col gap-1.5">
        {/* Icône + titre sur leur propre ligne */}
        <div className="flex items-center gap-2">
          {card.icon && (
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
              {card.icon}
            </div>
          )}
          <h3 className="min-w-0 flex-1 truncate text-xs font-semibold text-card-foreground">
            {card.title}
          </h3>
          {card.unread && <div className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </div>

        {/* Texte sur toute la largeur de la card, plus indenté par l'icône */}
        <p className="text-[11px] leading-snug text-muted-foreground line-clamp-3">
          {truncateText(card.description, truncateLength)}
        </p>
      </div>

      {isTopCard && (
        <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 text-center">
          <span className="text-[9px] text-muted-foreground/40">Swipe to navigate</span>
        </div>
      )}
    </motion.div>
  )
}
