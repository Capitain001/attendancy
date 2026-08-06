import { getCourseDetailAction } from '@/services/course'
import { CourseBanner } from '../CourseBanner'

export async function CourseBannerSection({ courseId }: { courseId: string }) {
  const res = await getCourseDetailAction(courseId)
  if ('error' in res) return null

  return <CourseBanner course={res.data} />
}
