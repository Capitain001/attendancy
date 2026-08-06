'use client'

import { Section } from '../ui/Section'
import { Badge } from '../ui/Badge'
import type { ScheduleItem } from '../types'
import { SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_CLASSES } from '../constants'
import { formatDate } from '@/lib/date'

interface UpcomingSessionsCardProps {
  schedules: readonly ScheduleItem[]
}

export function UpcomingSessionsCard({ schedules }: UpcomingSessionsCardProps) {
  const upcoming = schedules
    .filter((s) => s.status === 'PENDING')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 2)

  return (
    <Section className="flex flex-col justify-between">
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Prochaines séances
        </p>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-center border border-dashed border-foreground/15 rounded-lg p-3 hover:bg-muted/50 transition-colors text-muted-foreground">
          Aucune séance à venir.
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {upcoming.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {formatDate(s.startTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(s.startTime, 'TIME')} – {formatDate(s.endTime, 'TIME')} ·{' '}
                  {s.room.name}
                </p>
              </div>
              <Badge
                label={SCHEDULE_STATUS_LABELS[s.status]}
                className={SCHEDULE_STATUS_CLASSES[s.status]}
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
