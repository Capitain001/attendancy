import { connection } from 'next/server'
import { getClassesAction } from '@/services/class'
import { getCurrentYearAction } from '@/services/academic-year'
import { ClassList } from '@/components/direction/academic/ClassList'
import { typography } from '@/styles'

export default async function ClassesPage() {
  await connection()

  const [classesResult, yearResult] = await Promise.all([
    getClassesAction(),
    getCurrentYearAction(),
  ])

  if ('error' in classesResult) {
    return <p className={typography.body}>{classesResult.error}</p>
  }

  const year = 'data' in yearResult ? yearResult.data : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Classes</h1>
        <div className="flex items-center gap-3">
          {year && <span className={typography.small}>{year.name}</span>}
          <span className={typography.small}>{classesResult.data.length} classe{classesResult.data.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <ClassList classes={classesResult.data} />
    </div>
  )
}
