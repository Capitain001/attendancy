import { connection } from 'next/server'
import { notFound } from 'next/navigation'

import { PromotionCoursesSection } from '@/components/courses/direction/sections/PromotionCoursesSection'
import { getCoursesAction } from '@/services/course'
import { validateUUID } from '@/utils/server/validation'

interface PageProps {
  params: Promise<{ classId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  await connection()

  const { classId } = await params

  // validateUUID(classId)

  const res = await getCoursesAction(classId)

  if ('error' in res) notFound()

  const courses = res.data

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Cours</h1>
        <p className="text-sm text-muted-foreground">
          {courses.length === 0
            ? 'Aucun cours pour cette promotion.'
            : `${courses.length} cours répartis par semestre.`}
        </p>
      </div>
      <p>COURSES: </p>
      <pre>{JSON.stringify(courses, null, 2)}</pre>

      <PromotionCoursesSection courses={courses} />
    </div>
  )
}