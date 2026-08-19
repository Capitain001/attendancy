import { startOfMonth, endOfMonth } from 'date-fns'
import type { ScheduleStatus } from '@/prisma'
import type { EventColor, ScheduleEvent } from '@/components/event-calendar/types'
import type { GetSchedulesReturn } from '@/services/schedule'

export type ScheduleRow = GetSchedulesReturn[number]

const STATUS_COLOR: Record<ScheduleStatus, EventColor> = {
  PENDING:   'sky',
  COMPLETED: 'gray',
  CANCELED:  'red',
  MISSED:    'rose',
}

export function statusToColor(status: ScheduleStatus): EventColor {
  return STATUS_COLOR[status] ?? 'sky'
}

export function mapScheduleToEvent(schedule: ScheduleRow): ScheduleEvent {
  return {
    id:          schedule.id,
    title:       schedule.course.name,
    start:       schedule.startTime,
    end:         schedule.endTime,
    color:       statusToColor(schedule.status),
    description: schedule.notes ?? undefined,
    location:    schedule.room.name,
    meta: {
      classId:   schedule.classId,
      courseId:  schedule.courseId,
      teacherId: schedule.teacherId,
      roomId:    schedule.roomId,
      groupId:   schedule.groupId ?? undefined,
      status:    schedule.status,
      confirmed: schedule.confirmed,
    },
  }
}

/** Retourne la plage mensuelle autour d'une date ISO ou d'aujourd'hui. */
export function getPlanningRange(date: string | null) {
  const day = date ? new Date(date) : new Date()
  return { rangeStart: startOfMonth(day), rangeEnd: endOfMonth(day) }
}
