import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { addMonths, startOfMonth, endOfMonth } from 'date-fns'
import { getTeacherAction, getTeacherCoursesAction, getTeacherSchedulesAction } from '@/services/teacher'
import { getTeacherUnavailabilitiesAction } from '@/services/teacher-unavailability'
import { TeacherDetailPage } from '@/components/direction/people/TeacherDetailPage'

interface Props {
  params: Promise<{ slug: string; teacherId: string }>
}

export default async function TeacherDetailRoute({ params }: Props) {
  await connection()

  const { slug, teacherId } = await params
  const rangeStart = startOfMonth(new Date())
  const rangeEnd   = endOfMonth(addMonths(new Date(), 2))

  const [teacherResult, coursesResult, schedulesResult, unavailResult] = await Promise.all([
    getTeacherAction(teacherId),
    getTeacherCoursesAction(teacherId),
    getTeacherSchedulesAction(teacherId, rangeStart, rangeEnd),
    getTeacherUnavailabilitiesAction(teacherId),
  ])

  if ('error' in teacherResult) notFound()

  const courses         = Array.isArray(coursesResult) ? coursesResult : []
  const schedules       = 'error' in schedulesResult ? [] : schedulesResult.data
  const unavailabilities = 'error' in unavailResult   ? [] : unavailResult.data

  return (
    <TeacherDetailPage
      teacher={teacherResult.data}
      courses={courses}
      schedules={schedules}
      unavailabilities={unavailabilities}
      backHref={`/${slug}/direction/people/teachers`}
    />
  )
}
