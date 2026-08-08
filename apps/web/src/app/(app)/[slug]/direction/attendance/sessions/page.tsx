import { Suspense } from 'react'
import { connection } from 'next/server'
import { getDirectionSessionsByDateAction } from '@/services/session'
import { getClassesAction } from '@/services/class'
import { SessionsDirectionPage } from '@/components/direction/schedule/SessionsDirectionPage'
import { Loader } from '@/components/loaders/AppLoaders'

interface Props {
  searchParams?: Promise<{ date?: string; classId?: string }>
}

async function SessionsContent({ searchParams }: Props) {
  const params  = searchParams ? await searchParams : {}
  const dateStr = params?.date ?? new Date().toISOString().split('T')[0]

  const [sessionsResult, classesResult] = await Promise.all([
    getDirectionSessionsByDateAction(dateStr),
    getClassesAction(),
  ])

  const sessions = 'error' in sessionsResult ? [] : sessionsResult.data
  const classes  = 'error' in classesResult  ? [] : classesResult.data

  return (
    <SessionsDirectionPage
      sessions={sessions}
      classes={classes}
      currentDate={dateStr}
      currentClassId={params?.classId}
    />
  )
}

export default async function SessionsPage(props: Props) {
  await connection()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-semibold text-text-primary">Sessions de cours</h1>
      <Suspense fallback={<Loader />}>
        <SessionsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
