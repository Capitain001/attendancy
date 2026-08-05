import type { ClassProfileData } from './section/ui/types'
import type { getCoursesByClass } from '@/services/course/database'
import type { getTodayClassSchedules } from '@/services/schedule/database'

type CourseRow = Awaited<ReturnType<typeof getCoursesByClass>>[number]
type ScheduleRow = Awaited<ReturnType<typeof getTodayClassSchedules>>[number]

export function mapCoursesForClassSection(rows: CourseRow[]): ClassProfileData['courses'] {
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    credits: c.credits,
    duration: [c.durationDone ?? 0, c.durationTotal ?? 0] as [number, number],
    teachers: c.teachers
      .filter((t): t is typeof t & { teacher: NonNullable<typeof t.teacher> } => t.teacher !== null)
      .map((t) => ({
        isMain: t.isMain,
        teacher: {
          user: {
            firstName: t.teacher.user.firstName ?? undefined,
            lastName:  t.teacher.user.lastName  ?? undefined,
          },
        },
      })),
  }))
}

export function mapSchedulesForClassSection(rows: ScheduleRow[]): ClassProfileData['upcomingSchedules'] {
  return rows.map((s) => {
    const u = s.teacher?.user
    const teacherName = u
      ? [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '—'
      : '—'
    return {
      id: s.id,
      courseName: s.course.name,
      teacherName,
      room: s.room.name,
      startTime: s.startTime ? new Date(s.startTime).toISOString() : '',
      endTime:   s.endTime   ? new Date(s.endTime).toISOString()   : '',
      status: s.status as ClassProfileData['upcomingSchedules'][number]['status'],
      courseHoursDone:  undefined,
      courseHoursTotal: undefined,
    }
  })
}
