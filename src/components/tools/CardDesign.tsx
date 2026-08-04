import React from "react"
import { cn } from "@/lib/utils"

type CardDesignProps = {
  children: React.ReactNode
  className?: string
}

export default function CardDesign({ children, className }: CardDesignProps) {
  return (
    <div className="rounded-md max-w-64 bg-background p-px h-fit border-2 border-card transition-all duration-300 space-y-2 hover:shadow-glass">
      <div
        className={cn(
          "p-4 py-6 space-y-2 rounded-sm border bg-muted",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
