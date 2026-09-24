import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GetTeacherAttendanceOverviewDto } from '@/services/attendance'
import { formatRate, formatShortDate, getRateBarTone, plural } from './format'

type Props = {
  trend: GetTeacherAttendanceOverviewDto['absentees']
  className?: string
}

export function WeeklyTrendCard({ trend, className }: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Évolution hebdomadaire</CardTitle>
        <CardDescription>Taux de présence par semaine</CardDescription>
      </CardHeader>
      <CardContent>
        {/* <ol className="flex gap-2 overflow-x-auto pb-1">
          {trend.map(({ weekStart, rate, sessions }) => (
            <li
              key={weekStart.toISOString()}
              title={`Semaine du ${formatShortDate(weekStart)} · ${plural(sessions, 'séance')}`}
              className="flex min-w-10 flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs tabular-nums text-muted-foreground">{formatRate(rate)}</span>
              <div className="flex h-28 w-full items-end">
                <div
                  className={cn('w-full rounded-t-sm', getRateBarTone(rate))}
                  style={{ height: `${Math.max(rate ?? 0, 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{formatShortDate(weekStart)}</span>
            </li>
          ))}
        </ol> */}
      </CardContent>
    </Card>
  )
}
