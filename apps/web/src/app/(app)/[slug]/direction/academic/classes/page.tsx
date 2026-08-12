import { connection } from 'next/server'
import { getClassesAction } from '@/services/class'
import { getCurrentYearAction } from '@/services/academic-year'
import { getProgramTracksBasicAction } from '@/services/program-track'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { ClassList } from '@/components/direction/academic/ClassList'
import { ClassCreateButton } from '@/components/direction/academic/ClassForm'
import { typography } from '@/styles'

export default async function ClassesPage() {
  await connection()

  const [classesResult, yearResult, tracksResult] = await Promise.all([
    getClassesAction(),
    getCurrentYearAction(),
    getProgramTracksBasicAction({}),
  ])

  if ('error' in classesResult) {
    return <p className={typography.body}>{classesResult.error}</p>
  }

  const classes = classesResult.data
  const currentYear = 'data' in yearResult ? yearResult.data : null
  const programTracks = 'data' in tracksResult ? tracksResult.data : []

  const totalStudents = classes.reduce(
    (sum, c) => sum + (c._count?.studentEnrollments ?? 0),
    0,
  )

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Classes"
        // action={
        //   <ClassCreateButton
        //     programTracks={programTracks}
          //   currentYear={currentYear}
          // />
        // }
      />
      {(programTracks && currentYear)&& (
        <ClassCreateButton
          programTracks={programTracks}
          currentYear={currentYear}
        />
      )}

      {/* <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Classes actives"
          value={String(classes.length)}
          sub={currentYear ? `année ${currentYear.name}` : 'toutes années'}
        />
        <MetricCard
          label="Étudiants inscrits"
          value={String(totalStudents)}
          sub="toutes classes confondues"
        />
        {currentYear && (
          <MetricCard
            label="Année courante"
            value={currentYear.name}
            sub="en cours"
          />
        )}
      </section> */}

      <ClassList initialClasses={classes} />
    </div>
  )
}
