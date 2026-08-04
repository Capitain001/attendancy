"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils" 

interface ReusablePopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  showArrow?: boolean
  stopPropagation?: boolean
  triggerClassName?: string
  contentClassName?: string 
}

export function ReusablePopover({
  trigger,
  content,
  side = "top",
  align = "center",
  showArrow = true,
  stopPropagation = true,
  triggerClassName = "",
  contentClassName = "",
}: ReusablePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
          className={cn("inline-block cursor-pointer", triggerClassName)}
        >
          {trigger}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-fit scrollbar-hide rounded-md p-0", contentClassName)}
        side={side}
        align={align}
        showArrow={showArrow}
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
