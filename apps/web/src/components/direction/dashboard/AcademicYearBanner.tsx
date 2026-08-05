import { CalendarDays } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type Year = { id: string; name: string; startDate: Date; endDate: Date }

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function AcademicYearBanner({ year }: { year: Year }) {
  return (
    <div className={cn(card.base, 'flex items-center gap-3')}>
      <CalendarDays className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
      <div className="flex flex-col gap-0.5">
        <span className={cn(typography.label)}>Année académique en cours</span>
        <span className="text-sm font-medium text-text-primary">{year.name}</span>
      </div>
      <span className={cn(typography.small, 'ml-auto hidden md:block')}>
        {formatDate(year.startDate)} → {formatDate(year.endDate)}
      </span>
    </div>
  )
}
