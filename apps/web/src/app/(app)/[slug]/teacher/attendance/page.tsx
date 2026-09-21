// ⚠ Chemin à adapter à ton arborescence de routes (route group, préfixe rôle…).

import { PeriodSwitcher } from '@/components/teacher/attendance/PeriodSwitcher'
import { TeacherAttendanceOverview } from '@/components/teacher/attendance/TeacherAttendanceOverview'
import { Card, CardContent } from '@/components/ui/card'
import { getTeacherAttendanceOverviewAction } from '@/services/attendance'
import { DEFAULT_TEACHER_OVERVIEW_PERIOD, TEACHER_OVERVIEW_PERIODS } from '@/services/attendance/constants'

type Props = {
  searchParams: Promise<{ period?: string | string[] }>
}

export default async function TeacherAttendancePage({ searchParams }: Props) {
  const { period: rawPeriod } = await searchParams
  const period = TEACHER_OVERVIEW_PERIODS.find((p) => p === rawPeriod) ?? DEFAULT_TEACHER_OVERVIEW_PERIOD

  const result = await getTeacherAttendanceOverviewAction({ period })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Présences</h1>
          <p className="text-sm text-muted-foreground">Vue d&apos;ensemble sur vos cours.</p>
        </div>
        <PeriodSwitcher current={period} />
      </header>

      {result.data ? <TeacherAttendanceOverview overview={result.data} /> : <TeacherAttendanceLoadError message={result.error} />}
    </div>
  )
}

function TeacherAttendanceLoadError({ message }: { message?: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-destructive">
        {message ?? 'Impossible de charger les présences.'}
      </CardContent>
    </Card>
  )
}