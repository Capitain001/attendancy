import { validateUUID } from '@/utils/server/validation'
import { notFound } from 'next/navigation'
import { getUEByIdAction } from '@/services/ue'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { UEDetailsPanel } from '@/components/direction/academic/ue/detail/UEDetailsPanel'
import { UEEditButton } from '@/components/direction/academic/ue/detail/UEEditForm'
import { UECoursesList } from '@/components/direction/academic/ue/detail/UECoursesList'
import { getDepartmentsAction } from '@/services/department'
import { typography } from '@/styles'

interface PageProps {
  params: Promise<{ ueId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { ueId, slug } = await params
  
  validateUUID(ueId)

  const [result, deptsResult] = await Promise.all([
    getUEByIdAction({ ueId }),
    getDepartmentsAction()
  ])

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const ue = result.data

  if (!ue) {
    notFound()
  }

  const totalCredits = ue.ueCourses.reduce((sum, c) => sum + c.credits, 0)
  const totalDuration = ue.ueCourses.reduce((sum, c) => sum + (c.duration || 0), 0)
  const departments = ('data' in deptsResult ? deptsResult.data : []) ?? []

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title={ue.name}
        description={ue.code ? `Code UE : ${ue.code}` : "Aucun code renseigné"}
        action={<UEEditButton ue={ue} departments={departments} />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Éléments constitutifs"
          value={String(ue.ueCourses.length)}
          sub="cours rattachés à cette UE"
        />
        <MetricCard
          label="Crédits totaux"
          value={String(totalCredits)}
          sub="somme des crédits des EC"
        />
        <MetricCard
          label="Volume horaire"
          value={`${totalDuration}h`}
          sub="somme des heures des EC"
        />
      </section>

      <div className="mt-4 flex flex-col gap-6">
        <CollapseSection label="Informations Générales" defaultOpen>
          <UEDetailsPanel ue={ue} />
        </CollapseSection>

        <CollapseSection label="Éléments Constitutifs (EC)" count={ue.ueCourses.length} defaultOpen>
          <UECoursesList ueId={ue.id} courses={ue.ueCourses} />
        </CollapseSection>
      </div>
    </div>
  )
}
