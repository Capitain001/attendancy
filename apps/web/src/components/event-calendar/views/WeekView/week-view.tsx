import React, { useMemo } from "react"
import {
  addHours,
  startOfDay,
  eachHourOfInterval,
  isSameDay,
  isToday,
} from "date-fns"

import {
  AllDaySection,
  TimeColumn,
  WeekHeader,
  DayColumn,
} from "./components"
import {
  EndHour,
  StartHour,
} from "@/components/event-calendar/constants"
import { ScheduleEvent } from "@/components/event-calendar/types"
import { isMultiDayEvent, isAllDayEvent, getWeekDays, getWeekStart } from "@/components/event-calendar/utils"
import { useCurrentTimeIndicator } from "@/hooks/use-current-time-indicator"
import { getPositionedEventsForDay } from "./utils/eventPositioning"


interface WeekViewProps {
  currentDate: Date
  events: ScheduleEvent[]
  onEventSelect: (event: ScheduleEvent) => void
  onEventCreate: (startTime: Date) => void
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: "day" | "week" | "month") => void;
}

export function WeekView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
  onDateChange,
  onViewChange,
}: WeekViewProps) {
  const days = useMemo(() => getWeekDays(currentDate), [currentDate])

  // Début de semaine = premier jour de la grille (fallback typé si vide)
  const weekStart = days[0] ?? getWeekStart(currentDate)

  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate)
    return eachHourOfInterval({
      start: addHours(dayStart, StartHour),
      end: addHours(dayStart, EndHour - 1),
    })
  }, [currentDate])

  // Get all-day events and multi-day events for the week
  const allDayEvents = useMemo(() => {
    return events
      .filter((event) => {
        // Include explicitly marked all-day events or multi-day events
        return isAllDayEvent(event) || isMultiDayEvent(event)
      })
      .filter((event) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end)
        return days.some(
          (day: Date) =>
            isSameDay(day, eventStart) ||
            isSameDay(day, eventEnd) ||
            (day > eventStart && day < eventEnd)
        )
      })
  }, [events, days])

  // Process events for each day to calculate positions
  const processedDayEvents = useMemo(() => {
    return days.map((day: Date) => getPositionedEventsForDay(day, events))
  }, [days, events])

      // Gérer le clic sur un événement
  const handleEventClick = (event: ScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    onEventSelect(event)
  }

  
    // Gérer le clic sur un jour
    const handleDayClick = (date: Date) => {
      onDateChange?.(date);
    };

  const showAllDaySection = allDayEvents.length > 0
  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    "week"
  )

  return (
    <div data-slot="week-view" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <WeekHeader
          days={days}
          selectedDay={currentDate}
          onDayClick={handleDayClick}
          onViewChange={onViewChange}
        />
      </div>

      {showAllDaySection && (
        <div className="shrink-0">
          <AllDaySection
            days={days}
            allDayEvents={allDayEvents}
            weekStart={weekStart}
            onEventClick={handleEventClick}
          />
        </div>
      )}

      <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="grid min-h-max grid-cols-8">
          <TimeColumn hours={hours} />
          {days.map((day: Date, dayIndex: number) => (
            <DayColumn
              key={day.toString()}
              day={day}
              dayIndex={dayIndex}
              hours={hours}
              positionedEvents={processedDayEvents[dayIndex] ?? []}
              currentTimeVisible={currentTimeVisible && isToday(day)}
              currentTimePosition={currentTimePosition}
              onEventClick={handleEventClick}
              onEventCreate={onEventCreate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
