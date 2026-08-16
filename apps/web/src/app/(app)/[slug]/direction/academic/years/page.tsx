import { connection } from 'next/server'
import { getAcademicYearsAction } from '@/services/academic-year'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { AcademicYearList } from '@/components/direction/academic/AcademicYearList'
import { AcademicYearCreateButton } from '@/components/direction/academic/AcademicYearForm'

export default async function AcademicYearsPage() {
  await connection()
  const result = await getAcademicYearsAction()
  const years = 'data' in result ? result.data : []

  const currentYear = years?.find((y) => y.isCurrent)

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Années académiques"
        action={<AcademicYearCreateButton />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Années actives"
          value={years?.length.toString()??"--"}
          sub="dans cet établissement"
        />
        <MetricCard
          label="Année courante"
          value={currentYear?.name ?? '—'}
          sub={currentYear ? 'en cours' : 'aucune définie'}
        />
      </section>

      <AcademicYearList initialYears={years??[]} />
    </div>
  )
}
