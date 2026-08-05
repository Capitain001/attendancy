import { connection } from 'next/server'
import { getProgramTracksAction } from '@/services/program-track'
import { getDepartmentsAction } from '@/services/department'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { ProgramTrackList } from '@/components/direction/academic/ProgramTrackList'
import { ProgramTrackCreateButton } from '@/components/direction/academic/ProgramTrackForm'
import { typography } from '@/styles'

export default async function ProgramTracksPage() {
  await connection()

  const [tracksResult, deptsResult] = await Promise.all([
    getProgramTracksAction({}),
    getDepartmentsAction(),
  ])

  if ('error' in tracksResult) {
    return <p className={typography.body}>{tracksResult.error}</p>
  }

  const tracks      = tracksResult.data ?? []
  const departments = (('data' in deptsResult ? deptsResult.data : undefined) ?? [])

  const totalClasses = tracks.reduce((sum, t) => sum + (t._count?.classes ?? 0), 0)

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Filières"
        action={<ProgramTrackCreateButton departments={departments} />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Filières"
          value={String(tracks.length)}
          sub="dans cet établissement"
        />
        <MetricCard
          label="Classes associées"
          value={String(totalClasses)}
          sub="toutes filières confondues"
        />
        <MetricCard
          label="Départements"
          value={String(departments.length)}
          sub="avec filières rattachées"
        />
      </section>

      <ProgramTrackList initialTracks={tracks} departments={departments} />
    </div>
  )
}
