import { connection } from 'next/server'
import { getDirectionSessionsAction } from '@/services/session'
import { TodaySessionsWidget } from '@/components/direction/dashboard/TodaySessionsWidget'
import { typography } from '@/styles'

export default async function SessionsPage() {
  await connection()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-semibold text-text-primary">Sessions du jour</h1>
      <TodaySessionsWidget />
    </div>
  )
}
