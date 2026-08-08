import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { getStudentByIdForDirectionAction } from '@/services/student'
import { getStudentAttendanceSummaryAction } from '@/services/attendance'
import { StudentDetailPage } from '@/components/direction/people/StudentDetailPage'

interface Props {
  params: Promise<{ slug: string; studentId: string }>
}

export default async function StudentDetailRoute({ params }: Props) {
  await connection()

  const { slug, studentId } = await params

  const [studentResult, summaryResult] = await Promise.all([
    getStudentByIdForDirectionAction(studentId),
    getStudentAttendanceSummaryAction(studentId),
  ])

  if ('error' in studentResult) notFound()

  const summary = 'error' in summaryResult ? null : summaryResult.data

  return (
    <StudentDetailPage
      student={studentResult.data}
      summary={summary}
      backHref={`/${slug}/direction/people/students`}
    />
  )
}
