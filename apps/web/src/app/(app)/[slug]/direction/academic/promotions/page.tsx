import { connection } from 'next/server'
import { getClassesAction } from '@/services/class'
import { getCurrentYearAction } from '@/services/academic-year'
import { getProgramTracksBasicAction } from '@/services/program-track'
import { CompactMetricCard } from '@/components/stats/ui/CompactMetricCard'
import { EmptyResource } from '@/components/ux/EmptyResource'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { PromotionList } from '@/components/direction/academic/PromotionList'
import { ClassCreateButton } from '@/components/direction/academic/ClassForm'
import { typography } from '@/styles'

export default async function PromotionsPage() {
  await connection()

  const [classesResult, yearResult, tracksResult] = await Promise.all([
    getClassesAction({}),
    getCurrentYearAction(),
    getProgramTracksBasicAction({}),
  ])

  if ('error' in classesResult) {
    return (
      <EmptyResource
        title="Erreur"
        message={classesResult.error}
      />
    )
  }

  const classes = classesResult.data
  const currentYear = 'data' in yearResult ? yearResult.data : null
  const programTracks = 'data' in tracksResult ? tracksResult.data : []

  const classesInCurrentYear = currentYear
    ? classes.filter((c) => c.academicYearId === currentYear.id)
    : []

  const totalStudentsCurrentYear = classesInCurrentYear.reduce(
    (sum, c) => sum + (c._count?.studentEnrollments ?? 0),
    0,
  )

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Promotions"
        action={
          programTracks && currentYear ? (
            <ClassCreateButton
              programTracks={programTracks}
              currentYear={currentYear}
            />
          ) : null
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {currentYear && (
          <CompactMetricCard
            label="Année courante"
            value={currentYear.name}
          />
        )}
        <CompactMetricCard
          label="Promotions actives"
          value={String(classesInCurrentYear.length)}
          sub={currentYear ? `année ${currentYear.name}` : undefined}
        />
        <CompactMetricCard
          label="Étudiants inscrits"
          value={String(totalStudentsCurrentYear)}
          sub="promotions courantes"
        />
      </section>

      <PromotionList 
        initialClasses={classes} 
        programTracks={programTracks}
        currentYearId={currentYear?.id}
      />
    </div>
  )
}
