"use client"

import { cn } from "@/lib/utils"
import { CATEGORY_CONFIG, CATEGORY_ORDER } from "./categoryConfig"
import type { NotificationCategory } from "./types"

export interface NotificationTypeTabsProps {
  category: NotificationCategory
  onChange: (category: NotificationCategory) => void
}

export function NotificationTypeTabs({ category, onChange }: NotificationTypeTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-lg bg-secondary/50 p-1 w-fit mx-auto">
      {CATEGORY_ORDER.map((key) => {
        const { label, icon: Icon } = CATEGORY_CONFIG[key]
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            title={label}
            aria-label={`Filtrer sur ${label}`}
            className={cn(
              "grid size-7 place-items-center rounded-md transition-all",
              category === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
