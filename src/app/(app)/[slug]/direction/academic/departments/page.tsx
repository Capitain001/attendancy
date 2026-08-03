import { connection } from 'next/server'
import { getDepartmentsAction } from '@/services/department'
import { DepartmentList } from '@/components/direction/academic/DepartmentList'
import { typography } from '@/styles'

export default async function DepartmentsPage() {
  await connection()
  const result = await getDepartmentsAction()

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Départements</h1>
        <span className={typography.small}>{result.data.length} département{result.data.length !== 1 ? 's' : ''}</span>
      </div>
      <DepartmentList departments={result.data} />
    </div>
  )
}
