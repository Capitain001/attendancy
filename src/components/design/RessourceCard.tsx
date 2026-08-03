// components/ux/design/RessourceCard.tsx
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

type RessourceCardProps = {
  children: ReactNode
  className?: string
}

export function RessourceCard({ children, className }: RessourceCardProps) {
  return (
    <div
      className={cn(
        "rounded-md p-3 bg-zinc-100 dark:bg-[#474747] h-fit border-2 border-card transition-all duration-300 space-y-2 hover:shadow-glass",
        className
      )}
    >
      {children}
    </div>
  )
}



