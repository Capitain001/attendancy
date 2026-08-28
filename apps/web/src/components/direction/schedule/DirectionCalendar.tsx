'use client'

import { EventCalendar } from '@/components/event-calendar'
import { mapScheduleToEvent, type ScheduleRow } from '@/components/planning/utils'
import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { GetSchedulesDto } from '@/services/schedule/generated.types'

const CoursePCardDialog = dynamic(
  () => import('@/components/planning/card/CourseEventDialog').then(mod => mod.CoursePCardDialog),
  { ssr: false }
)

export function DirectionCalendar({ schedules }: { schedules: GetSchedulesDto }) {

  const events = useMemo(
    () => schedules.map((schedule) => mapScheduleToEvent(schedule)),
    [schedules]
  )

  return (
    <EventCalendar
      events={events}
      readOnly
      initialView="week"
      title="Planning"
      renderEventDialog={({ event, isOpen, onClose }) => {
        const schedule = schedules.find((s) => s.id === event?.id)
        return (
          <CoursePCardDialog
            schedule={schedule}
            isOpen={isOpen}
            onClose={onClose}
          />
        )
      }}
    />
  )
}
