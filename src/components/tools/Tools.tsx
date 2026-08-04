import * as React from "react"
import { cn } from "@/lib/utils"

type ToolbarProps = React.HTMLAttributes<HTMLDivElement>

export function Toolbar({ className, ...props }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border bg-popover p-1",
        className
      )}
      {...props}
    />
  )
}





type IconComponent = React.ComponentType<{
  size?: number
  className?: string
}>

type ToolbarIconsProps = {
  icons: IconComponent[]
  size?: number
  className?: string
}

export function ToolbarIcons({
  icons,
  size = 24,
  className,
}: ToolbarIconsProps) {
  return (
    <>
      {icons.map((Icon, index) => (
        <div
          key={index}
          className={cn(
            "cursor-pointer rounded p-px transition hover:bg-muted/40 hover:backdrop-blur-sm",
            className
          )}
        >
          <Icon size={size} />
        </div>
      ))}
    </>
  )
}
