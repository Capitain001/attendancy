import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GetTeacherAttendanceOverviewDto } from '@/services/attendance'
import { formatRate, getRateBarTone, getRateTextTone, plural } from './format'

type Props = {
  courses: GetTeacherAttendanceOverviewDto['byCourse']
  className?: string
}

export function CourseRatesCard({ courses, className }: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Par cours</CardTitle>
        <CardDescription>Taux de présence pour chaque cours et classe</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {courses.map(({ courseId, classId, courseName, className: classLabel, sessions, absent, rate }) => (
            <li key={`${courseId}:${classId}`} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{courseName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {classLabel} · {plural(sessions, 'séance')} · {plural(absent, 'absence')}
                  </p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums', getRateTextTone(rate))}>
                  {formatRate(rate)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', getRateBarTone(rate))}
                  style={{ width: `${rate ?? 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
