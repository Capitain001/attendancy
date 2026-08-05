"use client"

import { cn } from "@/lib/utils"

interface ComponentCardProps {
  children: React.ReactNode
  className?: string
}

export function ContentCard({
  children,
  className,
}: ComponentCardProps) {
  return (
    <div
      className={cn(
        "bg-design-bg border rounded-lg p-4",
        className
      )}
      data-slot="ContentCard"
    >
      {children}
    </div>
  )
}
