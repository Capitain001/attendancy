// TimeColumn.tsx
import React from "react"
interface TimeColumnProps {
  hours: Date[]
}

export function TimeColumn({ hours }: TimeColumnProps) {
  return (
    <div className="border-border/70 grid auto-cols-fr border-r ">
      {hours.map((hour, index) => (
        <div
          key={hour.toString()}
          className="border-border/70 relative min-h-[var(--week-cells-height)] border-b last:border-b-0 border-dashed"
        >
          {index > 0 && (
            <span className="bg-background text-muted-foreground/70 absolute -top-3 left-0 flex h-6 w-16 max-w-full items-center justify-end pe-2 text-[10px] sm:pe-4 sm:text-xs">
             {/* {format(hour, "h a")} */}
             {`${hour.getHours()}:00`}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
