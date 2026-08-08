'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, MapPin, User } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { card, typography } from '@/styles'
import type { OrgDaySessionRow } from '@/services/session'
import type { ClassItem } from '@/services/class'

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

function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function toISODateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

const ATTENDANCE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PRESENT: { label: 'Présents',    cls: 'text-green-600' },
  ABSENT:  { label: 'Absents',     cls: 'text-red-500'   },
  LATE:    { label: 'En retard',   cls: 'text-orange-500' },
  PENDING: { label: 'En attente',  cls: 'text-text-subtle' },
}

function SessionCard({ session }: { session: OrgDaySessionRow }) {
  const [expanded, setExpanded] = useState(false)
  const statusBadge = STATUS_BADGE[session.status] ?? 'bg-muted text-text-secondary'
  const statusLabel = STATUS_LABEL[session.status] ?? session.status
  const teacherName = session.teacher
    ? [session.teacher.user.firstName, session.teacher.user.lastName].filter(Boolean).join(' ')
    : null
  const total   = session.attendances.length
  const present = session.attendances.filter((a) => a.status === 'PRESENT').length

  const byCounts = session.attendances.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className={cn(card.base, 'flex flex-col gap-0')}>
      <div className="flex flex-col gap-2 p-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-text-primary">{session.course.name}</span>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', statusBadge)}>
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className={cn(typography.small, 'flex items-center gap-1')}>
            <Clock className="size-3" />
            {formatTime(session.startTime)} – {formatTime(session.endTime)}
          </span>
          {session.class && (
            <span className={cn(typography.small, 'flex items-center gap-1')}>
              {session.class.name}
              {session.group && <span className="text-text-subtle ml-1">· {session.group.name}</span>}
            </span>
          )}
          {session.room && (
            <span className={cn(typography.small, 'flex items-center gap-1')}>
              <MapPin className="size-3" />
              {session.room.name}
            </span>
          )}
          {teacherName && (
            <span className={cn(typography.small, 'flex items-center gap-1')}>
              <User className="size-3" />
              {teacherName}
            </span>
          )}
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round((present / total) * 100)}%` }}
              />
            </div>
            <span className={typography.small}>{present}/{total} présents</span>
          </div>
        )}
      </div>

      {total > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 border-t border-border/60 px-1 py-2 text-xs text-text-subtle hover:text-text-primary transition-colors"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? 'Masquer le détail' : 'Voir le détail'}
          </button>

          {expanded && (
            <div className="border-t border-border/60 px-1 pb-2 pt-2 grid grid-cols-2 gap-2">
              {Object.entries(byCounts).map(([status, count]) => {
                const cfg = ATTENDANCE_STATUS_LABELS[status]
                return (
                  <div key={status} className="flex items-center justify-between rounded bg-muted/30 px-2 py-1.5">
                    <span className={cn('text-xs', cfg?.cls ?? 'text-text-subtle')}>{cfg?.label ?? status}</span>
                    <span className="text-xs font-medium text-text-primary">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function SessionsDirectionPage({
  sessions,
  classes,
  currentDate,
  currentClassId,
}: {
  sessions: OrgDaySessionRow[]
  classes: ClassItem[]
  currentDate: string
  currentClassId?: string
}) {
  const router  = useRouter()
  const pathname = usePathname()

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (params.date)    sp.set('date', params.date)
    if (params.classId) sp.set('classId', params.classId)
    router.push(`${pathname}?${sp.toString()}`)
  }

  function changeDate(offset: number) {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + offset)
    navigate({ date: toISODateStr(d), classId: currentClassId })
  }

  function changeClass(classId: string) {
    navigate({ date: currentDate, classId: classId === 'all' ? undefined : classId })
  }

  const filtered = currentClassId
    ? sessions.filter((s) => s.class?.id === currentClassId)
    : sessions

  const isToday = currentDate === toISODateStr(new Date())

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de contrôle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[180px] text-center text-sm font-medium text-text-primary capitalize">
            {formatDate(currentDate)}
            {isToday && <span className="ml-1.5 text-[11px] text-text-subtle">(aujourd'hui)</span>}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {!isToday && (
          <Button
            variant="outline" size="sm" className="h-8 text-xs"
            onClick={() => navigate({ date: toISODateStr(new Date()), classId: currentClassId })}
          >
            Aujourd'hui
          </Button>
        )}

        <Select value={currentClassId ?? 'all'} onValueChange={changeClass}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Toutes les classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className={cn(typography.small, 'ml-auto')}>
          {filtered.length} séance{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className={cn(card.soft, 'py-12 text-center')}>
          <p className={typography.body}>Aucune séance{currentClassId ? ' pour cette classe' : ''} ce jour.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  )
}
