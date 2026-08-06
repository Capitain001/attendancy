import { getCourseDetailAction } from '@/services/course'
import { UpcomingSessionsCard } from '../components/UpcomingSessionsCard'
import { HistoryCard } from '../components/HistoryCard'

export async function CourseUpcomingSection({ courseId }: { courseId: string }) {
  const res = await getCourseDetailAction(courseId)
  if ('error' in res) return null
  return <UpcomingSessionsCard schedules={res.data.schedules} />
}

export async function CourseHistorySection({ courseId }: { courseId: string }) {
  const res = await getCourseDetailAction(courseId)
  if ('error' in res) return null
  return (
    <HistoryCard
      schedules={res.data.schedules}
      totalStudents={res.data.class._count.studentEnrollments}
    />
  )
}
