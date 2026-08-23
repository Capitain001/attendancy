"use client"

import { cn } from "@/lib/utils"

export interface StackPaginationProps {
  count: number
  activeIndex: number
  onSelect: (index: number) => void
}

export function StackPagination({ count, activeIndex, onSelect }: StackPaginationProps) {
  if (count <= 1) return null

  return (
    <div className="flex justify-center gap-1.5 pt-2">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={cn(
            "h-1 rounded-full transition-all",
            index === activeIndex ? "w-3 bg-primary" : "w-1 bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}
