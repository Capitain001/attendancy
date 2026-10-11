"use client"

import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { NotificationTypeTabs } from "./NotificationTypeTabs"
import { StackPagination } from "./StackPagination"
import { NotificationCard } from "./NotificationCard"
import { CATEGORY_CONFIG } from "./categoryConfig"
import type { NotificationCardData, NotificationCategory, StackedCard } from "./types"

export interface CardListViewProps {
  cards: NotificationCardData[]
  activeCategory: NotificationCategory
  onCategoryChange: (category: NotificationCategory) => void
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  getStackOrder: () => StackedCard[]
  truncateLength: number
  onCardClick: (card: NotificationCardData) => void
  onDragStart: () => void
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
}

export function CardListView({
  cards,
  activeCategory,
  onCategoryChange,
  activeIndex,
  onActiveIndexChange,
  getStackOrder,
  truncateLength,
  onCardClick,
  onDragStart,
  onDragEnd,
}: CardListViewProps) {
  const { emptyLabel } = CATEGORY_CONFIG[activeCategory]
  const orderedCards = getStackOrder()

  return (
    <div className="flex flex-col gap-2 h-full">
      <NotificationTypeTabs category={activeCategory} onChange={onCategoryChange} />

      <div className="relative flex-1 flex items-center justify-center min-h-[140px]">
        {cards.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">
            Aucune notification {emptyLabel}
          </div>
        ) : (
          <div className="relative w-44 h-32">
            <AnimatePresence mode="popLayout">
              {orderedCards.map((card) => (
                <NotificationCard
                  key={card.id}
                  card={card}
                  totalCards={cards.length}
                  truncateLength={truncateLength}
                  isTopCard={card.stackPosition === 0}
                  onClick={() => onCardClick(card)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <StackPagination
        count={cards.length}
        activeIndex={activeIndex}
        onSelect={onActiveIndexChange}
      />
    </div>
  )
}
