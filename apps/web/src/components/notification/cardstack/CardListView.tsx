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
  const displayCards = getStackOrder()
  const EmptyIcon = CATEGORY_CONFIG[activeCategory].icon

  return (
    <motion.div
      key="list-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full space-y-3"
    >
      <NotificationTypeTabs category={activeCategory} onChange={onCategoryChange} />

      {cards.length === 0 ? (
        <div className=" relative flex h-40 flex-col items-center justify-between rounded-lg border border-dashed border-border bg-card/75 py-4 text-center pattern-noise">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary/90 border border-primary/10 text-foreground">
            <EmptyIcon className="size-6" />
          </div>
          <p className="text-[13px] font-semibold text-card-foreground">
            Aucune notification {CATEGORY_CONFIG[activeCategory].emptyLabel}
          </p>
        </div>
      ) : (
        <>
          <motion.div layout className="relative mx-auto h-40 w-52">
            <AnimatePresence mode="popLayout">
              {displayCards.map((card) => (
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
          </motion.div>

          <StackPagination count={cards.length} activeIndex={activeIndex} onSelect={onActiveIndexChange} />
        </>
      )}
    </motion.div>
  )
}