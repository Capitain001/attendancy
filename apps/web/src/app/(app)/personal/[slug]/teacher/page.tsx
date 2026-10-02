// app/(app)/personal/[slug]/teacher/page.tsx
import { resolveTeacherView } from '@/components/teacher/personal/lib'
import { PersonalTeacherStart } from '@/components/teacher/personal/PersonalTeacherStart'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getCurrentTeacherId } from '@/services/teacher/actions'
import { getTeacherSchedulesAction, getTeacherSchedulesInfoAction } from '@/services/schedule'
import { TeacherPlanningScreen } from '@/components/teacher/planning/TeacherPlanningScreen'


export const metadata: Metadata = {
  title: 'Mon espace professeur | Attendancy',
  robots: { index: false, follow: false },
}

// L'accès (professeur, espace perso) est garanti en amont.
export default async function PersonalTeacherPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ start?: string; error?: string }>
}) {
  await connection()

  const [{ slug }, query] = await Promise.all([params, searchParams])
  const state = await resolveTeacherView(slug, query.start)

  if (state.view === 'REDIRECT') redirect(state.to)

  if (state.view === 'START') {
    return (
      <PersonalTeacherStart
        data={state.data}
        homeHref={state.homeHref}
        startHref={state.startHref}
        error={query.error}
      />
    )
  }

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) {
    return <p className="p-6 text-sm text-muted-foreground">Profil enseignant introuvable</p>
  }

  const now = new Date()
  const rangeStart = new Date(now)
  rangeStart.setHours(0, 0, 0, 0)
  const rangeEnd = new Date(now)
  rangeEnd.setHours(23, 59, 59, 999)

  const [schedulesResult, dailyResult] = await Promise.all([
    getTeacherSchedulesAction({ teacherId, rangeStart, rangeEnd }),
    getTeacherSchedulesInfoAction({ teacherId, rangeStart, rangeEnd }),
  ])

  const schedules = 'data' in schedulesResult ? schedulesResult.data ?? [] : []
  const dailySchedules = 'data' in dailyResult ? dailyResult.data ?? [] : []

  return (
    <main className="flex min-h-0 flex-1">
      <TeacherPlanningScreen
        teacherId={teacherId}
        initialSchedules={schedules}
        dailySchedules={dailySchedules}
      />
    </main>
  )
}