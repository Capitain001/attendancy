import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GetTeacherAttendanceOverviewDto } from '@/services/attendance'
import { formatRate, formatSessionDate, getRateTextTone } from './format'

type Props = {
  sessions: GetTeacherAttendanceOverviewDto['recentSessions']
  className?: string
}

export function RecentSessionsCard({ sessions, className }: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Dernières séances</CardTitle>
        <CardDescription>Présents · retards · absents</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {sessions.map(({ scheduleId, courseName, className: classLabel, startTime, present, late, absent, rate }) => (
            <li key={scheduleId} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{courseName}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {classLabel} · {formatSessionDate(startTime)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {present} · {late} · {absent}
                </span>
                <span className={cn('w-12 text-right text-sm font-semibold tabular-nums', getRateTextTone(rate))}>
                  {formatRate(rate)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
