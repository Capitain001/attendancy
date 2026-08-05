import { getDirectionSessionsAction } from '@/services/session'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { card, typography } from '@/styles'
import { Clock, MapPin, Radio, User } from 'lucide-react'

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    'bg-green-500/15 text-green-600',
  PENDING:   'bg-muted text-text-secondary',
  COMPLETED: 'bg-primary/10 text-primary',
  CANCELED:  'bg-red-500/10 text-red-500',
  MISSED:    'bg-orange-500/10 text-orange-500',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:    'En cours',
  PENDING:   'À venir',
  COMPLETED: 'Terminé',
  CANCELED:  'Annulé',
  MISSED:    'Manqué',
}

export async function TodaySessionsWidget() {
  const result = await getDirectionSessionsAction()

  if ('error' in result) {
    return (
      <div className={cn(card.base, 'text-center')}>
        <p className={typography.small}>{result.error}</p>
      </div>
    )
  }

  const schedules = result.data

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Radio className="size-4 text-primary" strokeWidth={1.5} />
        <span className={typography.label}>Séances du jour</span>
        <span className={cn(typography.small, 'ml-auto')}>{schedules.length} séance{schedules.length !== 1 ? 's' : ''}</span>
      </div>

      {schedules.length === 0 ? (
        <div className={cn(card.soft, 'text-center py-8')}>
          <p className={typography.body}>Aucune séance planifiée aujourd'hui.</p>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {schedules.map((s) => {
            const statusBadge = STATUS_BADGE[s.status] ?? 'bg-muted text-text-secondary'
            const statusLabel = STATUS_LABEL[s.status] ?? s.status
            const teacherName = s.teacher
              ? [s.teacher.user.firstName, s.teacher.user.lastName].filter(Boolean).join(' ')
              : null
            const attendanceTotal = s.attendances.length
            const attendancePresent = s.attendances.filter(a => a.status === 'PRESENT').length

            return (
              <div key={s.id} className={cn(card.base, 'flex flex-col gap-2')}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary line-clamp-1">{s.course.name}</span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', statusBadge)}>
                    {statusLabel}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className={cn(typography.small, 'flex items-center gap-1')}>
                    <Clock className="size-3" />
                    {formatTime(s.startTime)} – {formatTime(s.endTime)}
                  </span>
                  {s.class && (
                    <span className={cn(typography.small, 'flex items-center gap-1')}>
                      {s.class.name}
                    </span>
                  )}
                  {s.room && (
                    <span className={cn(typography.small, 'flex items-center gap-1')}>
                      <MapPin className="size-3" />
                      {s.room.name}
                    </span>
                  )}
                  {teacherName && (
                    <span className={cn(typography.small, 'flex items-center gap-1')}>
                      <User className="size-3" />
                      {teacherName}
                    </span>
                  )}
                </div>

                {attendanceTotal > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.round((attendancePresent / attendanceTotal) * 100)}%` }}
                      />
                    </div>
                    <span className={typography.small}>
                      {attendancePresent}/{attendanceTotal}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
