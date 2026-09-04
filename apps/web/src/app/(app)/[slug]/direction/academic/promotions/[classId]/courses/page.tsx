import { connection } from 'next/server'
import { notFound } from 'next/navigation'

import { PromotionCoursesPage } from '@/components/courses/direction/PromotionCoursesPage'
import { getCoursesAction } from '@/services/course'
import { getTermsAction } from '@/services/term'

interface PageProps {
  params: Promise<{ classId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  await connection()

  const { classId } = await params

  const coursesResult = await getCoursesAction(classId)
  const termsResult = await getTermsAction(classId)

  if ('error' in coursesResult) notFound()
  if ('error' in termsResult) notFound()

  const courses = coursesResult.data
  const terms = termsResult.data

  return (
    <PromotionCoursesPage
      classId={classId}
      courses={courses}
      classTerms={terms}
    />
  )
}