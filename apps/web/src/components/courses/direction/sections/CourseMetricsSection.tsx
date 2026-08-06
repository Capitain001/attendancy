import { getCourseDetailAction } from '@/services/course'
import { MetricCard } from '../ui/MetricCard'

export async function CourseMetricsSection({ courseId }: { courseId: string }) {
  const res = await getCourseDetailAction(courseId)
  if ('error' in res) return null

  const { data: course } = res
  const completedSchedules = course.schedules.filter((s) => s.status === 'COMPLETED')
  const totalPresences = completedSchedules.reduce(
    (acc, s) => acc + s.attendances.filter((a) => a.status === 'PRESENT').length,
    0,
  )
  const maxPresences = completedSchedules.length * course.class._count.studentEnrollments
  const attendanceRate =
    maxPresences > 0 ? Math.round((totalPresences / maxPresences) * 100) : null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        label="Étudiants"
        value={String(course.class._count.studentEnrollments)}
        sub="inscrits dans la classe"
      />
      <MetricCard
        label="Progression"
        value={`${course.durationDone}h`}
        sub={`sur ${course.durationTotal}h planifiées`}
      />
      <MetricCard
        label="Séances"
        value={String(completedSchedules.length)}
        sub={`sur ${course.schedules.length} planifiées`}
      />
      <MetricCard
        label="Assiduité"
        value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
        sub="taux de présence global"
      />
    </div>
  )
}
