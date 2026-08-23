"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { CATEGORY_CONFIG } from "./categoryConfig"
import type { NotificationCardData } from "./types"

export interface CardDetailViewProps {
  card: NotificationCardData
  onClose: () => void
}

// Au-delà de ce seuil, le texte passe en petite taille avec scroll plutôt
// qu'en grand centré.
const LONG_DESCRIPTION_THRESHOLD = 220

export function CardDetailView({ card, onClose }: CardDetailViewProps) {
  const { label, icon: CategoryIcon } = CATEGORY_CONFIG[card.category]
  const isLong = card.description.length > LONG_DESCRIPTION_THRESHOLD

  return (
    <motion.div
      onClick={onClose}
      key="detail-view"
      layoutId={`card-${card.id}`}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="flex h-full min-h-[220px] w-full cursor-alias flex-col rounded-lg border border-border bg-card p-3 relative pattern-noise"
      style={{ backgroundColor: card.color || undefined }}
    >
      {/* <BackgroundPattern pattern="pattern-noise-svg" shared opacity={0.2} /> */}
      <div className="flex min-h-3.5 justify-end">
        {card.unread && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
            Nouveau
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5 border-b border-border/40 pb-3 text-center">
        {card.icon && (
          <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground">
            {card.icon}
          </div>
        )}
        <div className="space-y-0.5">
          <p className="flex items-center justify-center gap-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            <CategoryIcon className="size-2.5" />
            {label}
          </p>
          <h3 className="text-[13px] font-semibold text-card-foreground">{card.title}</h3>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 pr-1 pt-3 text-muted-foreground leading-relaxed",
          isLong ? "overflow-y-auto text-[11px]" : "flex items-center text-sm"
        )}
      >
        {card.description}
      </div>
    </motion.div>
  )
}
