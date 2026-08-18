import { connection } from 'next/server'
import { getTeachersAction } from '@/services/teacher'
import { TeacherList } from '@/components/direction/people/TeacherList'
import { typography } from '@/styles'
import { Suspense } from 'react'
import { SectionHeader } from '@/components/direction/SectionHeader'

export default async function TeachersPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  const [{ slug }, result] = await Promise.all([params, getTeachersAction({})])

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const teachers = result.data ?? []

  return (
    <div className="flex flex-col gap-6 ">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <SectionHeader 
          title="Équipe pédagogique" 
          description="Gérez les enseignants, leurs départements d'affectation et leurs cours."
        />
        <span className={typography.small}>{result.data.length} enseignant{result.data.length !== 1 ? 's' : ''}</span>
      </div>


      <Suspense fallback={<div>Chargement...</div>}>
        <TeacherList teachers={teachers} slug={slug} />
      </Suspense>
    </div>
  )
}
