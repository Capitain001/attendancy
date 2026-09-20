import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { getCurrentTeacherId } from '@/services/teacher'
import { getCourseDetailAction } from '@/services/course'
import { getCourseEvaluationsAction } from '@/services/evaluation'
import { CourseEvaluationsScreen } from '@/components/teacher/courses/CourseEvaluationsScreen'

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  await connection()

  const { slug, id: courseId } = await params
  const teacherId = await getCurrentTeacherId()
  if (!teacherId) notFound()

  const [courseRes, evaluationsRes] = await Promise.all([
    getCourseDetailAction(courseId),
    getCourseEvaluationsAction(courseId),
  ])

  if (!('data' in courseRes) || !courseRes.data) {
    notFound()
  }

  const course = courseRes.data
  const evaluations = 'data' in evaluationsRes ? (evaluationsRes.data ?? []) : []

  return (
    <CourseEvaluationsScreen
      slug={slug}
      course={course}
      evaluations={evaluations}
    />
  )
}
