import { connection } from 'next/server'
import { getClassesAction } from '@/services/class'
import { getCurrentYearAction, getAcademicYearsAction } from '@/services/academic-year'
import { getProgramTracksBasicAction } from '@/services/program-track'
import { EmptyResource } from '@/components/ux/EmptyResource'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { PromotionList } from '@/components/direction/academic/PromotionList'
import { ClassCreateButton } from '@/components/direction/academic/ClassForm'
import { PromotionBanner } from '@/components/classes/direction/section/ui/PromotionBanner'
import { BookOpen } from 'lucide-react'

export default async function PromotionsPage() {
  await connection()

  const [classesResult, yearResult, yearsResult, tracksResult] = await Promise.all([
    getClassesAction({}),
    getCurrentYearAction(),
    getAcademicYearsAction(),
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
  const years = 'data' in yearsResult ? yearsResult.data : []
  const programTracks = 'data' in tracksResult ? tracksResult.data : []

  return (
    <div className="flex flex-col gap-y-4">
      <PromotionBanner title="Gestion des promotions" icon={BookOpen} />
      
      <SectionHeader
        title="Liste des promotions"
        action={
          programTracks && currentYear ? (
            <ClassCreateButton
              programTracks={programTracks}
              currentYear={currentYear}
            />
          ) : null
        }
      />

      <PromotionList
        initialClasses={classes}
        programTracks={programTracks}
        years={years}
        currentYearId={currentYear?.id}
      />
    </div>
  )
}