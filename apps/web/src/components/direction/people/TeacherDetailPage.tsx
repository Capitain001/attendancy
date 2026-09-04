import Link from 'next/link'
import { ChevronLeft, BookOpen, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UserIcon from '@/components/users/UserIcon'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { Mail, Phone } from 'lucide-react'
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
  teacher: TeacherData | null
  courses: TeacherCourse[]
  schedules: TeacherSchedules | []
  unavailabilities: TeacherUnavailabilities | []
  backHref: string
}) {
  if (!teacher) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Button variant="ghost" size="sm" className="w-fit gap-1 px-2 h-8" asChild>
          <Link href={backHref}>
            <ChevronLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <div className={cn(card.base, 'p-6 text-sm text-muted-foreground')}>
          Enseignant introuvable.
        </div>
      </div>
    )
  }

  const name    = [teacher.user.firstName, teacher.user.lastName].filter(Boolean).join(' ') || teacher.user.email
  const now     = new Date()
  const upcoming = (schedules ?? []).filter((s) => new Date(s.startTime) >= now)
  const past     = (schedules ?? []).filter((s) => new Date(s.startTime) < now)

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

      {/* Profil étendu */}
      <div className={cn(card.base, 'overflow-hidden flex flex-col')}>
        {/* Banner */}
        <div className="h-24 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        
        <div className="px-6 pb-6 pt-0 relative flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="relative -mt-12 shrink-0">
            <UserIcon 
              name={name} 
              avatarUrl={teacher.user.avatar_url} 
              className="size-24 text-3xl border-4 border-background bg-background shadow-sm" 
            />
            <span className={cn(
              "absolute bottom-1 right-1 size-4 rounded-full border-2 border-background",
              teacher.user.status === 'ACTIVE' ? "bg-green-500" : "bg-muted-foreground"
            )} title={teacher.user.status === 'ACTIVE' ? "Actif" : "Inactif"} />
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1 pt-2 sm:pt-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary truncate">{name}</h1>
              {teacher.department && (
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {teacher.department.name}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="size-3.5" />
                <span className={typography.small}>{teacher.user.email}</span>
              </div>
              {teacher.user.phone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" />
                  <span className={typography.small}>{teacher.user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
          <span className="text-2xl font-bold text-text-primary">{teacher._count.courses}</span>
          <span className={cn(typography.small, 'text-muted-foreground')}>Cours affectés</span>
        </div>
        <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
          <span className="text-2xl font-bold text-text-primary">{upcoming.length}</span>
          <span className={cn(typography.small, 'text-muted-foreground')}>Séances prévues</span>
        </div>
        <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
          <span className="text-2xl font-bold text-text-primary">{past.length}</span>
          <span className={cn(typography.small, 'text-muted-foreground')}>Séances passées</span>
        </div>
        <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
          <span className="text-2xl font-bold text-text-primary">{unavailabilities.length}</span>
          <span className={cn(typography.small, 'text-muted-foreground')}>Indisponibilités</span>
        </div>
      </div>

      {/* Cours affectés */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="size-4 text-text-subtle" strokeWidth={1.5} />
          <h2 className={cn(typography.label, 'font-semibold')}>Cours affectés</h2>
        </div>
        {courses.length > 0 ? (
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
        ) : (
          <div className={cn(card.soft, 'flex flex-col items-center justify-center p-6 text-center text-muted-foreground')}>
            <BookOpen className="size-8 mb-2 opacity-20" />
            <p className="text-sm font-medium text-text-primary">Aucun cours affecté</p>
            <p className="text-xs">Cet enseignant n&apos;a pas encore de cours assignés.</p>
          </div>
        )}
      </section>

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
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <AlertCircle className="size-4 text-text-subtle" strokeWidth={1.5} />
          <h2 className={cn(typography.label, 'font-semibold')}>Indisponibilités</h2>
        </div>
        {unavailabilities.length > 0 ? (
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
        ) : (
          <div className={cn(card.soft, 'flex flex-col items-center justify-center p-6 text-center text-muted-foreground')}>
            <AlertCircle className="size-8 mb-2 opacity-20" />
            <p className="text-sm font-medium text-text-primary">Aucune indisponibilité</p>
            <p className="text-xs">Cet enseignant est disponible selon l&apos;emploi du temps normal.</p>
          </div>
        )}
      </section>
    </div>
  )
}
