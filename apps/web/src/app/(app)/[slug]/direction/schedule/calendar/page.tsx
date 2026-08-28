import { connection } from 'next/server'
import { getSchedulesAction } from '@/services/schedule'
import { DirectionCalendar } from '@/components/direction/schedule/DirectionCalendar'
import type { ScheduleEvent } from '@/components/event-calendar/types'
import { startOfWeek, endOfWeek } from 'date-fns'
import { typography } from '@/styles'
import { mapScheduleToEvent } from '@/components/planning/utils'

export default async function CalendarPage() {
  await connection()

  const now = new Date()
  const rangeStart = startOfWeek(now, { weekStartsOn: 1 })
  const rangeEnd   = endOfWeek(now,   { weekStartsOn: 1 })

  const result = await getSchedulesAction({ rangeStart, rangeEnd })

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const schedules = result.data

  return <DirectionCalendar schedules={schedules} />
}
