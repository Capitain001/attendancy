import { connection } from 'next/server'
import { getProgramTracksAction } from '@/services/program-track'
import { ProgramList } from '@/components/direction/academic/ProgramList'
import { typography } from '@/styles'

export default async function ProgramsPage() {
  await connection()
  const result = await getProgramTracksAction({})

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Filières</h1>
        <span className={typography.small}>{result.data.length} filière{result.data.length !== 1 ? 's' : ''}</span>
      </div>
      <ProgramList programs={result.data} />
    </div>
  )
}
