// eventPositioning.ts
// Extraction de la logique de positionnement des événements depuis WeekView

import { ScheduleEvent } from "@/components/event-calendar/types"
import { areIntervalsOverlapping, differenceInMinutes, getHours, getMinutes, isSameDay, startOfDay, addHours } from "date-fns"
import { StartHour, WeekCellsHeight } from "@/components/event-calendar/constants"
import { isMultiDayEvent, isAllDayEvent } from "@/components/event-calendar/utils"

export interface PositionedEvent {
  event: ScheduleEvent
  top: number
  height: number
  left: number
  width: number
  zIndex: number
}

export function getPositionedEventsForDay(day: Date, events: ScheduleEvent[]): PositionedEvent[] {
  // Get events for this day that are not all-day events or multi-day events
  const dayEvents = events.filter((event) => {
    if (isAllDayEvent(event) || isMultiDayEvent(event)) return false
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    return (
      isSameDay(day, eventStart) ||
      isSameDay(day, eventEnd) ||
      (eventStart < day && eventEnd > day)
    )
  })

  // Sort events by start time and duration
  const sortedEvents = [...dayEvents].sort((a, b) => {
    const aStart = new Date(a.start)
    const bStart = new Date(b.start)
    const aEnd = new Date(a.end)
    const bEnd = new Date(b.end)
    if (aStart < bStart) return -1
    if (aStart > bStart) return 1
    const aDuration = differenceInMinutes(aEnd, aStart)
    const bDuration = differenceInMinutes(bEnd, bStart)
    return bDuration - aDuration
  })

  const positionedEvents: PositionedEvent[] = []
  const dayStart = startOfDay(day)
  const columns: { event: ScheduleEvent; end: Date }[][] = []

  sortedEvents.forEach((event) => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    const adjustedStart = isSameDay(day, eventStart) ? eventStart : dayStart
    const adjustedEnd = isSameDay(day, eventEnd)
      ? eventEnd
      : addHours(dayStart, 24)
    const startHour = getHours(adjustedStart) + getMinutes(adjustedStart) / 60
    const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60
    const top = (startHour - StartHour) * WeekCellsHeight
    const height = (endHour - startHour) * WeekCellsHeight
    let columnIndex = 0
    let placed = false
    while (!placed) {
      const col = columns[columnIndex] || []
      if (col.length === 0) {
        columns[columnIndex] = col
        placed = true
      } else {
        const overlaps = col.some((c) =>
          areIntervalsOverlapping(
            { start: adjustedStart, end: adjustedEnd },
            {
              start: new Date(c.event.start),
              end: new Date(c.event.end),
            }
          )
        )
        if (!overlaps) {
          placed = true
        } else {
          columnIndex++
        }
      }
    }
    const currentColumn = columns[columnIndex] || []
    columns[columnIndex] = currentColumn
    currentColumn.push({ event, end: adjustedEnd })
    const width = columnIndex === 0 ? 1 : 0.9
    const left = columnIndex === 0 ? 0 : columnIndex * 0.1
    positionedEvents.push({
      event,
      top,
      height,
      left,
      width,
      zIndex: 10 + columnIndex,
    })
  })
  return positionedEvents
}
