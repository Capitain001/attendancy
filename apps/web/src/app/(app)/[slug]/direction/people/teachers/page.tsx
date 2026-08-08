import { connection } from 'next/server'
import { getTeachersAction } from '@/services/teacher'
import { TeacherList } from '@/components/direction/people/TeacherList'
import { typography } from '@/styles'

export default async function TeachersPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection()
  const [{ slug }, result] = await Promise.all([params, getTeachersAction()])

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Enseignants</h1>
        <span className={typography.small}>{result.data.length} enseignant{result.data.length !== 1 ? 's' : ''}</span>
      </div>
      <TeacherList teachers={result.data} slug={slug} />
    </div>
  )
}
