import { DirectionClassDetailPage } from '@/components/classes/direction'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ classId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { classId, slug } = await params
  if (!classId) notFound()
  return <DirectionClassDetailPage classId={classId} slug={slug} />
}
