import { connection } from 'next/server'
import {
  getOrgIdentityAction,
  getOrgUsageAction,
  getOrgResourcesCountsAction,
  getOrgDailyMetricsAction,
} from '@/services/organization'
import { OrgMetricsCard } from '@/components/direction/dashboard/OrgMetricsCard'
import { DailyMetricsCard } from '@/components/direction/dashboard/DailyMetricsCard'
import { PrismaErrorPanel } from '@/components/server/PrismaErrorPanel'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { Database, HardDrive, Users, BookOpen } from 'lucide-react'

export default async function AdminPage() {
  await connection()

  const [identityResult, usageResult, countsResult, metricsResult] = await Promise.all([
    getOrgIdentityAction(),
    getOrgUsageAction(),
    getOrgResourcesCountsAction(),
    getOrgDailyMetricsAction(),
  ])

  const identity = 'data' in identityResult ? identityResult.data : null
  const usage    = 'data' in usageResult    ? usageResult.data    : null
  const counts   = 'data' in countsResult   ? countsResult.data   : null
  const metrics  = 'data' in metricsResult  ? metricsResult.data  : null

  return (
    <main className="min-h-screen bg-background p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin système</h1>
        {identity && (
          <p className={cn(typography.small, 'text-text-subtle')}>
            {identity.name}
            {identity.slug && <> · <span className="font-mono">{identity.slug}</span></>}
            {identity.domain && <> · {identity.domain}</>}
          </p>
        )}
      </div>

      {usage && (
        <section className="flex flex-col gap-3">
          <h2 className={typography.label}>Utilisation</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className={cn(card.stat, 'flex flex-col gap-2')}>
              <div className="flex items-center justify-between">
                <span className={typography.label}>Utilisateurs</span>
                <Users className="size-4 text-text-subtle" strokeWidth={1.5} />
              </div>
              <span className={typography.metric}>{usage.currentUsers}</span>
            </div>
            <div className={cn(card.stat, 'flex flex-col gap-2')}>
              <div className="flex items-center justify-between">
                <span className={typography.label}>Cours actifs</span>
                <BookOpen className="size-4 text-text-subtle" strokeWidth={1.5} />
              </div>
              <span className={typography.metric}>{usage.activeCourses}</span>
            </div>
            <div className={cn(card.stat, 'flex flex-col gap-2')}>
              <div className="flex items-center justify-between">
                <span className={typography.label}>Salles actives</span>
                <Database className="size-4 text-text-subtle" strokeWidth={1.5} />
              </div>
              <span className={typography.metric}>{usage.activeRooms}</span>
            </div>
            <div className={cn(card.stat, 'flex flex-col gap-2')}>
              <div className="flex items-center justify-between">
                <span className={typography.label}>Stockage utilisé</span>
                <HardDrive className="size-4 text-text-subtle" strokeWidth={1.5} />
              </div>
              <span className={typography.metric}>{usage.usedStorage}</span>
            </div>
          </div>
        </section>
      )}

      {counts && (
        <section className="flex flex-col gap-3">
          <h2 className={typography.label}>Ressources</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <OrgMetricsCard counts={counts} />
          </div>
        </section>
      )}

      {metrics && (
        <section className="flex flex-col gap-3">
          <DailyMetricsCard metrics={metrics} />
        </section>
      )}

      <PrismaErrorPanel />
    </main>
  )
}
