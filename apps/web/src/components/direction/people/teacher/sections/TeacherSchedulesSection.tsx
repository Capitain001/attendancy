import { Calendar, Clock } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetTeacherSchedulesDto } from '@/services/teacher'

const SCHEDULE_STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-600',
  PENDING: 'bg-muted text-text-secondary',
  COMPLETED: 'bg-primary/10 text-primary',
  CANCELED: 'bg-red-500/10 text-red-500',
  MISSED: 'bg-orange-500/10 text-orange-500',
}

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function TeacherSchedulesSection({ schedules }: { schedules: GetTeacherSchedulesDto | [] }) {
  const now = new Date()
  const upcoming = (schedules ?? []).filter((s) => new Date(s.startTime) >= now)
  const past = (schedules ?? []).filter((s) => new Date(s.startTime) < now)

  return (
    <>
      {/* Planning à venir */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <Calendar className="size-4 text-text-subtle" strokeWidth={1.5} />
          <h2 className={cn(typography.label, 'font-semibold')}>Séances à venir</h2>
          {upcoming.length > 0 && <span className={cn(typography.small, 'ml-auto')}>{upcoming.length}</span>}
        </div>
        {upcoming.length > 0 ? (
          <div className="flex flex-col gap-2">
            {upcoming.slice(0, 10).map((s) => (
              <div key={s.id} className={cn(card.base, 'flex items-center gap-3 py-2.5')}>
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[44px]">
                  <span className="text-xs font-semibold text-text-primary">{formatDate(s.startTime).split(' ')[0]}</span>
                  <span className={typography.small}>{new Date(s.startTime).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.course.name}</p>
                  <p className={typography.small}>
                    {s.class.name}{s.group ? ` · ${s.group.name}` : ''} · {s.room?.name ?? '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', SCHEDULE_STATUS_BADGE[s.status] ?? 'bg-muted text-text-subtle')}>
                    {s.status}
                  </span>
                  <span className={cn(typography.small, 'flex items-center gap-0.5')}>
                    <Clock className="size-3" />
                    {formatTime(s.startTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(card.soft, 'flex flex-col items-center justify-center p-6 text-center text-muted-foreground')}>
            <Calendar className="size-8 mb-2 opacity-20" />
            <p className="text-sm font-medium text-text-primary">Aucune séance prévue</p>
            <p className="text-xs">Il n&apos;y a pas de séances à venir pour le moment.</p>
          </div>
        )}
      </section>

      {/* Séances passées */}
      {past.length > 0 && (
        <section className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2 px-1">
            <Clock className="size-4 text-text-subtle" strokeWidth={1.5} />
            <h2 className={cn(typography.label, 'font-semibold')}>Séances récentes</h2>
          </div>
          <div className="flex flex-col gap-2">
            {past.slice(-5).reverse().map((s) => (
              <div key={s.id} className={cn(card.base, 'flex items-center gap-3 py-2.5 opacity-70')}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{s.course.name}</p>
                  <p className={typography.small}>{formatDate(s.startTime)} · {formatTime(s.startTime)}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0', SCHEDULE_STATUS_BADGE[s.status] ?? 'bg-muted text-text-subtle')}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
