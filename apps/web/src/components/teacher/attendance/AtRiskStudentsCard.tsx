import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GetTeacherAttendanceOverviewDto } from '@/services/attendance'
import { ABSENTEEISM_MIN_SESSIONS, ABSENTEEISM_RATE_THRESHOLD } from '@/services/attendance/policy'
import { formatRate, getRateTextTone, plural } from './format'

type Props = {
  students: GetTeacherAttendanceOverviewDto['absentees']
  className?: string
}

export function AtRiskStudentsCard({ students, className }: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>À surveiller</CardTitle>
        <CardDescription>
          Taux sous {ABSENTEEISM_RATE_THRESHOLD} % sur vos séances (min. {ABSENTEEISM_MIN_SESSIONS} décomptées)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun étudiant sous le seuil sur cette période.</p>
        ) : (
          <ul className="divide-y">
            {students.map(({ studentId, firstName, lastName, rate, absent }) => (
              <li key={studentId} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {[firstName, lastName].filter(Boolean).join(' ') || 'Étudiant'}
                  </p>
                  <p className="text-xs text-muted-foreground">{plural(absent, 'absence')}</p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums', getRateTextTone(rate))}>
                  {formatRate(rate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
