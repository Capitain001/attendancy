import { Activity, CalendarCheck, CalendarX, CheckCircle2 } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type DailyMetrics = {
  activeSessions: number
  todaySchedules: number
  todayAbsences: number
  completedSchedules: number
}

const ITEMS = [
  { key: 'activeSessions',     label: 'Sessions actives',  icon: Activity,      accent: 'text-green-500' },
  { key: 'todaySchedules',     label: 'Séances du jour',   icon: CalendarCheck, accent: 'text-primary' },
  { key: 'completedSchedules', label: 'Séances terminées', icon: CheckCircle2,  accent: 'text-text-subtle' },
  { key: 'todayAbsences',      label: 'Absences',          icon: CalendarX,     accent: 'text-red-500' },
] as const

export function DailyMetricsCard({ metrics }: { metrics: DailyMetrics }) {
  return (
    <div className={cn(card.base, 'flex flex-col gap-3')}>
      <span className={cn(typography.label, 'mb-1')}>Aujourd'hui</span>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ITEMS.map(({ key, label, icon: Icon, accent }) => (
          <div key={key} className="flex items-center gap-3">
            <Icon className={cn('size-5 shrink-0', accent)} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-base font-semibold text-text-primary">{metrics[key]}</span>
              <span className={typography.small}>{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
