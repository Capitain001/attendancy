"use client"

import { useState } from "react"
import { AnimatePresence, LayoutGroup } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCardStack } from "./useCardStack"
import { CardListView } from "./CardListView"
import { CardDetailView } from "./CardDetailView"
import { CATEGORY_ORDER } from "./categoryConfig"
import type { NotificationCardData, NotificationCategory } from "./types"

export type { NotificationCardData, NotificationCategory }

export interface MorphingCardStackProps {
  cards?: NotificationCardData[]
  className?: string
  onCardClick?: (card: NotificationCardData) => void
  truncateLength?: number
}

export function NotificationCardStack({
  cards = [],
  className,
  onCardClick,
  truncateLength = 60,
}: MorphingCardStackProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>(CATEGORY_ORDER[0])

  const filteredCards = cards.filter((c) => c.category === activeCategory)

  const { activeIndex, setActiveIndex, isDragging, handleDragStart, handleDragEnd, getStackOrder } =
    useCardStack(filteredCards)

  const handleCategoryChange = (category: NotificationCategory) => {
    setActiveCategory(category)
    setActiveIndex(0)
  }

  if (!cards || cards.length === 0) {
    return null
  }

  const selectedCard = cards.find((c) => c.id === activeCardId)

  const handleCardClick = (card: NotificationCardData) => {
    if (isDragging) return
    onCardClick?.(card)
    setActiveCardId(card.id)
  }

  return (
    <LayoutGroup>
      <div className={cn("w-full h-full select-none relative", className)}>
        <AnimatePresence mode="wait">
          {!selectedCard ? (
            <CardListView
              cards={filteredCards}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              getStackOrder={getStackOrder}
              truncateLength={truncateLength}
              onCardClick={handleCardClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ) : (
            <CardDetailView card={selectedCard} onClose={() => setActiveCardId(null)} />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  )
}
