import { DirectionCourseDetailPage } from '@/components/courses/direction'
import { validateUUID } from '@/utils/server/validation'

interface PageProps {
  params: Promise<{ courseId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { courseId, slug } = await params
  // UUID invalide → notFound() immédiat, avant toute requête DB du détail cours.
  validateUUID(courseId)
  return <DirectionCourseDetailPage courseId={courseId} slug={slug} />
}
