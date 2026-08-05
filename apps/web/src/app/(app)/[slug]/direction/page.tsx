import { Suspense } from 'react'
import { format } from 'date-fns'
import { connection } from 'next/server'
import {
  getOrgIdentityAction,
  getOrgDailyMetricsAction,
  getOrgResourcesCountsAction,
} from '@/services/organization'
import { getCurrentYearAction } from '@/services/academic-year'
import { getOrgTodayAbsencesAction } from '@/services/attendance'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { AcademicYearBanner } from '@/components/direction/dashboard/AcademicYearBanner'
import { AlertCategoryCards } from '@/components/direction/dashboard/AlertCategoryCards'
import { TodaySessionsWidget } from '@/components/direction/dashboard/TodaySessionsWidget'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { Loader } from '@/components/loaders/AppLoaders'

export default async function DirectionDashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await connection()

  const { slug } = await params
  const base = `/${slug}/direction`

  const [identityRes, countsRes, metricsRes, yearRes, absencesRes] =
    await Promise.all([
      getOrgIdentityAction(),
      getOrgResourcesCountsAction(),
      getOrgDailyMetricsAction(),
      getCurrentYearAction(),
      getOrgTodayAbsencesAction(),
    ])

  const orgName  = 'data' in identityRes  ? (identityRes.data?.name ?? slug)  : slug
  const counts   = 'data' in countsRes    ? countsRes.data                     : null
  const metrics  = 'data' in metricsRes   ? metricsRes.data                   : null
  const year     = 'data' in yearRes      ? yearRes.data                      : null
  const absences = 'data' in absencesRes  ? (absencesRes.data ?? [])          : []

  const schedulesCount =
    (metrics?.todaySchedules ?? 0) === 0
      ? '0'
      : `${metrics?.completedSchedules ?? 0}/${metrics?.todaySchedules ?? 0}`

  return (
    <div className="scroll-smooth flex flex-col gap-y-4 pb-10">
      {year && <AcademicYearBanner year={year} />}

      {/* ── En-tête ── */}
      {/* <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Tableau de bord
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{orgName}</h1>
      </header> */}

      {/* ── Métriques du jour ── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Anomalies"
          value="0"
          sub="retards + séances manquées"
          href={`${base}/sessions`}
        />
        <MetricCard
          label="Absences aujourd'hui"
          value={String(metrics?.todayAbsences ?? 0)}
          sub="présences marquées absentes"
        />
        <MetricCard
          label="Séances du jour"
          value={schedulesCount}
          sub="complétées aujourd'hui"
          href={`${base}/schedule`}
        />
        <MetricCard
          label="Sessions en cours"
          value={String(metrics?.activeSessions ?? 0)}
          sub="actuellement actives"
          href={`${base}/sessions`}
        />
      </section>

      {/* ── Absences du jour ── */}
      <CollapseSection
        label="Absences du jour"
        count={absences.length}
        defaultOpen={absences.length > 0}
      >
        {absences.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            Aucune absence enregistrée aujourd'hui.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {absences.map((a) => {
              const name =
                [a.student.user.firstName, a.student.user.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Étudiant'
              return (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className="size-2 shrink-0 rounded-full bg-red-500/70" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.schedule.course.name}
                      {' · '}
                      {a.schedule.group?.name ?? a.schedule.class.name}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {format(a.schedule.startTime, 'HH:mm')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CollapseSection>

      {/* ── Séances en cours ── */}
      <CollapseSection
        label="Séances en cours"
        count={metrics?.activeSessions ?? 0}
        defaultOpen
      >
        <Suspense fallback={<Loader />}>
          <TodaySessionsWidget />
        </Suspense>
      </CollapseSection>

      {/* ── Ressources ── */}
      <CollapseSection label="Ressources">
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            label="Cours"
            value={String(counts?.courses ?? 0)}
            sub="cours actifs"
            href={`${base}/courses`}
          />
          <MetricCard
            label="Classes"
            value={String(counts?.classes ?? 0)}
            sub="classes ouvertes"
            href={`${base}/classes`}
          />
          <MetricCard
            label="Salles"
            value={String(counts?.rooms ?? 0)}
            sub="salles disponibles"
            href={`${base}/rooms`}
          />
          <MetricCard
            label="Étudiants"
            value={String(counts?.students ?? 0)}
            sub={`${counts?.teachers ?? 0} enseignants`}
            href={`${base}/students`}
          />
        </div>
      </CollapseSection>
    </div>
  )
}
