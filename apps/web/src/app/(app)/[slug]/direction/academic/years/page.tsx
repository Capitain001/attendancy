import { connection } from 'next/server'
import { getAcademicYearsAction } from '@/services/academic-year'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { AcademicYearList } from '@/components/direction/academic/AcademicYearList'
import { AcademicYearCreateButton } from '@/components/direction/academic/AcademicYearForm'
import { CoverflowCarousel } from '@/components/ui/coverflow-carousel'

export default async function AcademicYearsPage() {
  await connection()
  const result = await getAcademicYearsAction()
  const years = 'data' in result ? result.data : []

  const currentYear = years?.find((y) => y.isCurrent)

  const slides = (years ?? []).map((year) => ({
    src: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop",
    alt: year.name,
    title: year.name,
    subtitle: year.isCurrent ? "Année en cours" : "Année académique",
    meta: [
      { label: "Début", value: new Date(year.startDate).toLocaleDateString('fr-FR') },
      { label: "Fin", value: new Date(year.endDate).toLocaleDateString('fr-FR') }
    ],
    content: (
      <div className="flex h-full w-full items-center justify-center bg-black/30 p-6 text-center text-white backdrop-blur-[1px] transition-colors hover:bg-black/40">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black tracking-tighter drop-shadow-md">
            {new Date(year.startDate).getFullYear()}
          </span>
          <span className="text-2xl font-black opacity-80 drop-shadow-md">-</span>
          <span className="text-3xl font-black tracking-tighter drop-shadow-md">
            {new Date(year.endDate).getFullYear()}
          </span>
        </div>
      </div>
    )
  }))

  return (
    <div className="flex flex-col gap-y-6">
      <SectionHeader
        title="Années académiques"
        action={<AcademicYearCreateButton />}
      />

      {slides.length > 0 && (
        <div className="w-full bg-card rounded-xl border p-4 shadow-sm">
          <CoverflowCarousel 
            slides={slides} 
            showCaption 
            showNavigation 
            showPagination 
          />
        </div>
      )}

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
