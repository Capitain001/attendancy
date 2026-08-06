import { Section } from '../ui/Section'
import { Badge } from '../ui/Badge'
import type { ScheduleItem } from '../types'
import { SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_CLASSES } from '../constants'
import { formatDate, formatDates } from '@/lib/date'

interface HistoryCardProps {
  schedules: readonly ScheduleItem[]
  totalStudents: number
}

export function HistoryCard({ schedules, totalStudents }: HistoryCardProps) {
  const past = schedules
    .filter((s) => ['COMPLETED', 'CANCELED', 'MISSED'].includes(s.status))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  return (
    <Section>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Historique des séances
        </p>
        <span className="text-xs text-muted-foreground">{past.length} séances passées</span>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm min-w-[460px]">
          <thead>
            <tr>
              {['Date', 'Horaire', 'Salle', 'Présence', 'Statut'].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2.5 border-b border-border/50"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {past.slice(0, 5).map((s) => (
              <tr key={s.id}>
                <td className="py-2.5 font-medium text-foreground capitalize">
                  {formatDates(new Date(s.startTime))}
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {formatDate(s.startTime, 'TIME')} – {formatDate(s.endTime, 'TIME')}
                </td>
                <td className="py-2.5 text-muted-foreground">{s.room.name}</td>
                <td className="py-2.5 text-muted-foreground">
                  {s.status === 'COMPLETED'
                    ? `${s.attendances.filter((a) => a.status === 'PRESENT').length} / ${totalStudents}`
                    : '—'}
                </td>
                <td className="py-2.5">
                  <Badge
                    label={SCHEDULE_STATUS_LABELS[s.status]}
                    className={SCHEDULE_STATUS_CLASSES[s.status]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {past.length > 5 && (
        <div className="mt-3 text-center">
          <button className="text-xs text-primary hover:underline">
            Voir toutes les séances
          </button>
        </div>
      )}
    </Section>
  )
}
