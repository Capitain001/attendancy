import { connection } from 'next/server'
import { getProgramsAction } from '@/services/program'
import { getProgramTracksAction } from '@/services/program-track'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { ProgramList } from '@/components/direction/academic/ProgramList'
import { ProgramCreateButton } from '@/components/direction/academic/ProgramForm'
import { typography } from '@/styles'

export default async function ProgramsPage() {
  await connection()

  const [programsResult, tracksResult] = await Promise.all([
    getProgramsAction({}),
    getProgramTracksAction({}),
  ])

  if ('error' in programsResult) {
    return <p className={typography.body}>{programsResult.error}</p>
  }

  const programs = programsResult.data
  const tracks   = ('data' in tracksResult ? tracksResult.data : undefined) ?? []

  const totalClasses = programs.reduce((sum, p) => sum + p.classes.length, 0)

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Programmes"
        action={<ProgramCreateButton tracks={tracks} />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Programmes"
          value={String(programs.length)}
          sub="dans cet établissement"
        />
        <MetricCard
          label="Classes associées"
          value={String(totalClasses)}
          sub="tous programmes confondus"
        />
        <MetricCard
          label="Filières"
          value={String(tracks.length)}
          sub="disponibles pour les programmes"
        />
      </section>

      <ProgramList initialPrograms={programs} tracks={tracks} />
    </div>
  )
}
