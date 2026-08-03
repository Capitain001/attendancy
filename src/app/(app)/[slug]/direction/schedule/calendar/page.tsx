import { connection } from 'next/server'
import { getSchedulesAction } from '@/services/schedule'
import { DirectionCalendar } from '@/components/direction/schedule/DirectionCalendar'
import type { ScheduleEvent } from '@/components/event-calendar/types'
import { startOfWeek, endOfWeek } from 'date-fns'
import { typography } from '@/styles'

export default async function CalendarPage() {
  await connection()

  const now = new Date()
  const rangeStart = startOfWeek(now, { weekStartsOn: 1 })
  const rangeEnd   = endOfWeek(now,   { weekStartsOn: 1 })

  const result = await getSchedulesAction({ rangeStart, rangeEnd })

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const events: ScheduleEvent[] = result.data.map((s) => ({
    id:    s.id,
    title: s.course.name,
    start: s.startTime,
    end:   s.endTime,
    location: s.room?.name,
    meta: {
      courseId:  s.course.id,
      teacherId: s.teacher?.id ?? '',
      classId:   s.class?.id,
      groupId:   s.group?.id,
      roomId:    s.room?.id,
      status:    s.status as never,
    },
  }))

  return <DirectionCalendar events={events} />
}
