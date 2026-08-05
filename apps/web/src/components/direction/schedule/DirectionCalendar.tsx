'use client'

import { EventCalendar } from '@/components/event-calendar'
import type { ScheduleEvent } from '@/components/event-calendar/types'

export function DirectionCalendar({ events }: { events: ScheduleEvent[] }) {
  return (
    <EventCalendar
      events={events}
      readOnly
      initialView="week"
      title="Planning"
    />
  )
}
