import { DirectionCourseDetailPage } from '@/components/courses/direction'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ courseId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { courseId, slug } = await params
  if (!courseId) notFound()
  return <DirectionCourseDetailPage courseId={courseId} slug={slug} />
}
