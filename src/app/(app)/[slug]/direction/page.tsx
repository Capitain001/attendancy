import { Suspense } from 'react'
import { connection } from 'next/server'
import { getOrgResourcesCountsAction, getOrgDailyMetricsAction } from '@/services/organization'
import { getCurrentYearAction } from '@/services/academic-year'
import { OrgMetricsCard } from '@/components/direction/dashboard/OrgMetricsCard'
import { DailyMetricsCard } from '@/components/direction/dashboard/DailyMetricsCard'
import { AcademicYearBanner } from '@/components/direction/dashboard/AcademicYearBanner'
import { TodaySessionsWidget } from '@/components/direction/dashboard/TodaySessionsWidget'
import { Loader } from '@/components/loaders/AppLoaders'

export default async function DirectionDashboard() {
  await connection()

  const [countsResult, metricsResult, yearResult] = await Promise.all([
    getOrgResourcesCountsAction(),
    getOrgDailyMetricsAction(),
    getCurrentYearAction(),
  ])

  const counts  = 'data' in countsResult  ? countsResult.data  : null
  const metrics = 'data' in metricsResult ? metricsResult.data : null
  const year    = 'data' in yearResult    ? yearResult.data    : null

  return (
    <div className="flex flex-col gap-4">
      {year && <AcademicYearBanner year={year} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {counts && <OrgMetricsCard counts={counts} />}
      </div>

      {metrics && <DailyMetricsCard metrics={metrics} />}

      <Suspense fallback={<Loader />}>
        <TodaySessionsWidget />
      </Suspense>
    </div>
  )
}
