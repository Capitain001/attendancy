import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GetTeacherAttendanceOverviewDto } from '@/services/attendance'
import { AtRiskStudentsCard } from './AtRiskStudentsCard'
import { CourseRatesCard } from './CourseRatesCard'
import { RecentSessionsCard } from './RecentSessionsCard'
import { WeeklyTrendCard } from './WeeklyTrendCard'
import { formatRate, getRateTextTone, plural } from './format'

type Props = {
  overview: GetTeacherAttendanceOverviewDto
}

export function TeacherAttendanceOverview({ overview: { totals, byCourse, trend, absentees, recentSessions } }: Props) {
  if (totals.sessions === 0) return <TeacherAttendanceEmpty />

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Taux de présence"
          value={formatRate(totals.rate)}
          hint={`${totals.present + totals.late} présences sur ${totals.denominator}`}
          valueClassName={getRateTextTone(totals.rate)}
        />
        <Kpi label="Séances" value={String(totals.sessions)} hint="effectuées et clôturées" />
        <Kpi label="Absences" value={String(totals.absent)} hint={`+ ${plural(totals.excused, 'justifiée')}`} />
        <Kpi label="Retards" value={String(totals.late)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <WeeklyTrendCard trend={trend} className="lg:col-span-2" />
        <AtRiskStudentsCard students={absentees} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CourseRatesCard courses={byCourse} />
        <RecentSessionsCard sessions={recentSessions} />
      </div>
    </div>
  )
}

type KpiProps = {
  label: string
  value: string
  hint?: string
  valueClassName?: string
}

function Kpi({ label, value, hint, valueClassName }: KpiProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={cn('text-3xl font-semibold tabular-nums', valueClassName)}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function TeacherAttendanceEmpty() {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        Aucun pointage enregistré sur cette période.
      </CardContent>
    </Card>
  )
}
