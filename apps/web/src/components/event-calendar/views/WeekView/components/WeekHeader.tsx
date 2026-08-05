import React from "react"
import { format, isSameDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { fr } from "date-fns/locale";

interface WeekHeaderProps {
  days: Date[];
  selectedDay?: Date;
  onDayClick?: (date: Date) => void;
  onViewChange?: (view: "day" | "week" | "month") => void;
}

export function WeekHeader({ days,
  selectedDay,
  onDayClick,
  onViewChange
}: WeekHeaderProps) {


  const handleDayClick = (day: Date) => {
    // Appeler le callback de changement de jour
    onDayClick?.(day);
    // Changer la vue vers la vue jour
    onViewChange?.("day");
  };

  return (
    <div className="sticky top-0 z-30 mb-3">
      <div className="flex flex-1  rounded border bg-muted/80 backdrop-blur-md">
        {/* Colonne fixe à gauche */}
        <div className="flex w-full flex-1 flex-shrink-0 border-r border-dashed py-2 text-center text-sm text-muted-foreground/70 pointer-events-none">
          <span className="m-auto max-[479px]:sr-only">
            {format(new Date(), "O")}
          </span>
        </div>

        {/* Jours de la semaine */}
        {days.map((day) => (
          <div
            key={day.toString()}
            className={cn(
              "data-[today=true]:text-foreground data-[today=true]:font-medium",

              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-sm text-muted-foreground",
              [6, 0].includes(day.getDay()) && "text-muted-foreground/50",
              "hover:bg-muted cursor-pointer transition-colors",
              "border-r border-dashed last:border-r-0"
            )}
            data-today={isToday(day)}
            onClick={() => handleDayClick(day)}
          >

            <span
              className={cn(
                [6, 0].includes(day.getDay()) && "text-muted-foreground/50"
              )}
              aria-hidden="true">
              {/* {format(day, "E")[0]} {format(day, "d")} */}
              {format(day, "EEE", { locale: fr })}
            </span>
            <span
              className={cn(
                "grid h-5 w-5 text-xs place-content-center rounded-full",
                isToday(day) && "bg-primary/40 text-primary-foreground",
                selectedDay &&
                isSameDay(day, selectedDay) &&
                !isToday(day) &&
                "bg-foreground text-primary-foreground",
                !isToday(day) &&
                !isSameDay(day, selectedDay!) &&
                "hover:bg-muted/70"
              )}
            >
              {format(day, "d")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
