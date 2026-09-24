import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TEACHER_OVERVIEW_PERIODS, getPeriodLabel } from '@/services/attendance/constants'
import type { TeacherOverviewPeriod } from '@/services/attendance/constants'

// Simples liens vers ?period= : la page (RSC) relit le searchParam,
// pas besoin d'état ni de composant client.
export function PeriodSwitcher({ current }: { current: TeacherOverviewPeriod }) {
  return (
    <nav aria-label="Période" className="inline-flex rounded-lg bg-muted p-1">
      {TEACHER_OVERVIEW_PERIODS.map((period) => (
        <Link
          key={period}
          href={`?period=${period}`}
          replace
          scroll={false}
          aria-current={period === current ? 'page' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            period === current ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {getPeriodLabel(period)}
        </Link>
      ))}
    </nav>
  )
}
