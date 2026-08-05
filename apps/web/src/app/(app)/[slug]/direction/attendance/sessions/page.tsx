import { Suspense } from 'react'
import { connection } from 'next/server'
import { TodaySessionsWidget } from '@/components/direction/dashboard/TodaySessionsWidget'
import { Loader } from '@/components/loaders/AppLoaders'

export default async function SessionsPage() {
  await connection()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-semibold text-text-primary">Sessions du jour</h1>
      <Suspense fallback={<Loader />}>
        <TodaySessionsWidget />
      </Suspense>
    </div>
  )
}
