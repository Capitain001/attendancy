import { getCourseDetailAction } from '@/services/course'
import { CourseInfoCard } from '../components/CourseInfoCard'

export async function CourseInfoAndStatsSection({ courseId }: { courseId: string }) {
  const res = await getCourseDetailAction(courseId)
  if ('error' in res) return null

  const { data: course } = res

  const fields = {
    name: course.name,
    description: course.description,
    credits: course.credits,
    ueCourse: {
      code: course.ueCourse.code,
      duration: course.ueCourse.duration,
    },
    class: {
      name: course.class.name,
      level: course.class.level,
    },
  }

  return <CourseInfoCard courseId={courseId} fields={fields} />
}
