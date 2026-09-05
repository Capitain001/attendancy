import { connection } from 'next/server'
import { getTeachersAction } from '@/services/teacher'
import { Suspense } from 'react'
import { typography } from '@/styles'
import { DirectionTeachersSection } from '@/components/direction/people/DirectionTeachersSection'

export default async function TeachersPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  const [{ slug }, result] = await Promise.all([params, getTeachersAction({})])

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const teachers = result.data ?? []

  return (
    <div className="flex flex-col gap-6 ">
      <Suspense fallback={<div>Chargement...</div>}>
        <DirectionTeachersSection teachers={teachers} slug={slug} />
      </Suspense>
    </div>
  )
}
