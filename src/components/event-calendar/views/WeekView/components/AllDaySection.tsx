// AllDaySection.tsx
// Extraction de la section All Day depuis WeekView

import React from "react"
import { EventItem } from "@/components/event-calendar/components/event-item"
import { cn } from "@/lib/utils"
import { ScheduleEvent } from "@/components/event-calendar/types"
import { isSameDay, isToday, isBefore } from "date-fns"

interface AllDaySectionProps {
  days: Date[]
  allDayEvents: ScheduleEvent[]
  weekStart: Date
  onEventClick: (event: ScheduleEvent, e: React.MouseEvent) => void
}

export function AllDaySection({ days, allDayEvents, weekStart, onEventClick }: AllDaySectionProps) {
  return (
    <div className="border-border/70 bg-muted/50 border-b">
      <div className="grid grid-cols-8">
        <div className="border-border/70 relative border-r">
          <span className="text-muted-foreground/70 absolute bottom-0 left-0 h-6 w-16 max-w-full pe-2 text-right text-[10px] sm:pe-4 sm:text-xs">
            All day
          </span>
        </div>
        {days.map((day, dayIndex) => {
          const dayAllDayEvents = allDayEvents.filter((event) => {
            const eventStart = new Date(event.start)
            const eventEnd = new Date(event.end)
            return (
              isSameDay(day, eventStart) ||
              (day > eventStart && day < eventEnd) ||
              isSameDay(day, eventEnd)
            )
          })

          return (
            <div
              key={day.toString()}
              className="border-border/70 relative border-r p-1 last:border-r-0"
              data-today={isToday(day) || undefined}
            >
              {dayAllDayEvents.map((event) => {
                const eventStart = new Date(event.start)
                const eventEnd = new Date(event.end)
                const isFirstDay = isSameDay(day, eventStart)
                const isLastDay = isSameDay(day, eventEnd)
                const isFirstVisibleDay = dayIndex === 0 && isBefore(eventStart, weekStart)
                const shouldShowTitle = isFirstDay || isFirstVisibleDay
                return (
                  <EventItem
                    key={`spanning-${event.id}`}
                    onClick={(e) => onEventClick(event, e)}
                    event={event}
                    view="month"
                    isFirstDay={isFirstDay}
                    isLastDay={isLastDay}
                  >
                    <div className={cn("truncate", !shouldShowTitle && "invisible")} aria-hidden={!shouldShowTitle}>
                      {event.title}
                    </div>
                  </EventItem>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
