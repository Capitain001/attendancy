import { connection } from 'next/server'
import { subDays, addDays, startOfDay, endOfDay } from 'date-fns'
import { getCurrentTeacherId } from '@/services/teacher'
import { getTeacherSchedulesInfoAction } from '@/services/schedule'
import { TeacherAttendanceScreen } from '@/components/teacher/attendance/TeacherAttendanceScreen'

export default async function Page() {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  const now = new Date()
  const rangeStart = subDays(startOfDay(now), 7)
  const rangeEnd = addDays(endOfDay(now), 14)

  const res = await getTeacherSchedulesInfoAction({
    teacherId,
    rangeStart,
    rangeEnd,
  })

  const schedules = res.data ?? []

  return <TeacherAttendanceScreen teacherId={teacherId} initialSchedules={schedules} />
}

