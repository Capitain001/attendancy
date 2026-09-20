import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { getCurrentTeacherId } from '@/services/teacher'
import { getCourseDetailAction } from '@/services/course'
import { getCourseLastScheduleAction, getTeacherNextScheduleAction } from '@/services/schedule'
import { CoursePage } from '@/components/teacher/courses/CoursePage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection()

  const { id: courseId } = await params
  const teacherId = await getCurrentTeacherId()
  if (!teacherId) notFound()

  const [courseRes, lastRes, nextRes] = await Promise.all([
    getCourseDetailAction(courseId),
    getCourseLastScheduleAction(courseId),
    getTeacherNextScheduleAction({ teacherId }),
  ])

  if (!('data' in courseRes) || !courseRes.data) {
    // notFound()
    return <div> no data </div>
  }

  const course = courseRes.data
  const lastSchedule = 'data' in lastRes ? lastRes.data ?? null : null
  const nextSchedule = 'data' in nextRes ? nextRes.data ?? null : null

  return (
    <CoursePage
      course={course}
      lastSchedule={lastSchedule}
      nextSchedule={nextSchedule}
    />
  )
}
