import Link from 'next/link'
import { ChevronLeft, BookOpen, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UserIcon from '@/components/users/UserIcon'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { getTeacherAction, getTeacherSchedulesAction } from '@/services/teacher'
import type { getTeacherUnavailabilitiesAction } from '@/services/teacher-unavailability'

type TeacherData      = Extract<Awaited<ReturnType<typeof getTeacherAction>>, { data: unknown }>['data']
type TeacherCourse    = { id: string; name: string; class: { id: string; name: string } }
type TeacherSchedules = Extract<Awaited<ReturnType<typeof getTeacherSchedulesAction>>, { data: unknown }>['data']
type TeacherUnavailabilities = Extract<Awaited<ReturnType<typeof getTeacherUnavailabilitiesAction>>, { data: unknown }>['data']

const DAYS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']

const UNAVAIL_LABEL: Record<string, string> = {
  WEEKLY:     'Hebdomadaire',
  DATE_RANGE: 'Plage de dates',
  ONE_TIME:   'Ponctuel',
}

const SCHEDULE_STATUS_BADGE: Record<string, string> = {
  ACTIVE:    'bg-green-500/15 text-green-600',
  PENDING:   'bg-muted text-text-secondary',
  COMPLETED: 'bg-primary/10 text-primary',
  CANCELED:  'bg-red-500/10 text-red-500',
  MISSED:    'bg-orange-500/10 text-orange-500',
}

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function TeacherDetailPage({
  teacher,
  courses,
  schedules,
  unavailabilities,
  backHref,
}: {
  teacher: TeacherData
  courses: TeacherCourse[]
  schedules: TeacherSchedules
  unavailabilities: TeacherUnavailabilities
  backHref: string
}) {
  const name    = [teacher.user.firstName, teacher.user.lastName].filter(Boolean).join(' ') || teacher.user.email
  const now     = new Date()
  const upcoming = schedules.filter((s) => new Date(s.startTime) >= now)
  const past     = schedules.filter((s) => new Date(s.startTime) < now)

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1 px-2 h-8" asChild>
          <Link href={backHref}>
            <ChevronLeft className="size-4" />
            Retour
          </Link>
        </Button>
      </div>

      {/* Identité */}
      <div className={cn(card.base, 'flex items-center gap-4 py-4')}>
        <UserIcon name={name} avatarUrl={teacher.user.avatar_url} className="size-14 text-lg shrink-0" />
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-base font-semibold text-text-primary">{name}</h1>
          <p className={typography.small}>{teacher.user.email}</p>
          {teacher.user.phone && <p className={typography.small}>{teacher.user.phone}</p>}
          {teacher.department && (
            <span className="mt-1 w-fit rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {teacher.department.name}
            </span>
          )}
        </div>
        <div className="ml-auto shrink-0 flex flex-col items-end gap-1">
          <span className="text-2xl font-bold text-text-primary">{teacher._count.courses}</span>
          <span className={typography.small}>cours affectés</span>
        </div>
      </div>

      {/* Cours affectés */}
      {courses.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <BookOpen className="size-4 text-text-subtle" strokeWidth={1.5} />
            <h2 className={cn(typography.label, 'font-semibold')}>Cours affectés</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {courses.map((c) => (
              <div key={c.id} className={cn(card.soft, 'flex items-center justify-between gap-2 py-2.5')}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                  <p className={typography.small}>{c.class.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Planning à venir */}
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="size-4 text-text-subtle" strokeWidth={1.5} />
            <h2 className={cn(typography.label, 'font-semibold')}>Séances à venir</h2>
            <span className={cn(typography.small, 'ml-auto')}>{upcoming.length}</span>
          </div>
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
        </section>
      )}

      {/* Séances passées */}
      {past.length > 0 && (
        <section className="flex flex-col gap-2">
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

      {/* Indisponibilités */}
      {unavailabilities.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="size-4 text-text-subtle" strokeWidth={1.5} />
            <h2 className={cn(typography.label, 'font-semibold')}>Indisponibilités</h2>
          </div>
          <div className="flex flex-col gap-2">
            {unavailabilities.map((u) => (
              <div key={u.id} className={cn(card.soft, 'flex items-start gap-3 py-2.5')}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {UNAVAIL_LABEL[u.type] ?? u.type}
                    {u.dayOfWeek !== null && ` — ${DAYS[u.dayOfWeek]}`}
                  </p>
                  {u.startTime && u.endTime && (
                    <p className={typography.small}>{u.startTime} – {u.endTime}</p>
                  )}
                  {u.startDate && (
                    <p className={typography.small}>{formatDate(u.startDate)}{u.endDate ? ` → ${formatDate(u.endDate)}` : ''}</p>
                  )}
                  {u.reason && <p className={cn(typography.small, 'italic')}>{u.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
