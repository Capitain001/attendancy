import Link from 'next/link'
import { ChevronLeft, BookOpen, Clock, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UserIcon from '@/components/users/UserIcon'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { getStudentByIdForDirectionAction } from '@/services/student'
import type { getStudentAttendanceSummaryAction } from '@/services/attendance'

type StudentData = Extract<Awaited<ReturnType<typeof getStudentByIdForDirectionAction>>, { data: unknown }>['data']
type AttendanceSummary = Extract<Awaited<ReturnType<typeof getStudentAttendanceSummaryAction>>, { data: unknown }>['data']

function riskBadge(rate: number | null): { cls: string; label: string; icon: typeof TrendingDown } {
  if (rate === null)  return { cls: 'bg-muted text-text-subtle', label: '—', icon: Minus }
  if (rate < 70)      return { cls: 'bg-red-500/10 text-red-600', label: `${rate}% — À risque`, icon: TrendingDown }
  if (rate < 85)      return { cls: 'bg-orange-500/10 text-orange-500', label: `${rate}% — Vigilance`, icon: Minus }
  return               { cls: 'bg-green-500/10 text-green-600', label: `${rate}% — Régulier`, icon: TrendingUp }
}

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const ATTENDANCE_STATUS_CLS: Record<string, string> = {
  PRESENT: 'bg-green-500/15 text-green-600',
  ABSENT:  'bg-red-500/10 text-red-500',
  LATE:    'bg-orange-500/10 text-orange-500',
  PENDING: 'bg-muted text-text-subtle',
}

const ATTENDANCE_STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Présent',
  ABSENT:  'Absent',
  LATE:    'En retard',
  PENDING: 'En attente',
}

export function StudentDetailPage({
  student,
  summary,
  backHref,
}: {
  student: StudentData
  summary: AttendanceSummary | null
  backHref: string
}) {
  const name = [student.user.firstName, student.user.lastName].filter(Boolean).join(' ') || student.user.email
  const risk = riskBadge(summary?.rate ?? null)
  const RiskIcon = risk.icon

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
        <UserIcon name={name} avatarUrl={student.user.avatar_url} className="size-14 text-lg shrink-0" />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h1 className="text-base font-semibold text-text-primary">{name}</h1>
          <p className={typography.small}>{student.user.email}</p>
          {student.user.phone && <p className={typography.small}>{student.user.phone}</p>}
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {student.class.name}
            </span>
            {student.groups.map((g) => (
              <span key={g.id} className="rounded bg-muted px-2 py-0.5 text-xs text-text-secondary">
                {g.name}
              </span>
            ))}
          </div>
        </div>
        {summary && (
          <div className="ml-auto shrink-0 flex flex-col items-end gap-1">
            <div className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', risk.cls)}>
              <RiskIcon className="size-3.5" />
              {risk.label}
            </div>
            <span className={typography.small}>Inscrit le {formatDate(student.enrolledAt)}</span>
          </div>
        )}
      </div>

      {/* Résumé assiduité */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className={cn(card.stat, 'flex flex-col gap-1')}>
            <span className="text-2xl font-bold text-text-primary">{summary.rate !== null ? `${summary.rate}%` : '—'}</span>
            <span className={typography.small}>Taux d'assiduité</span>
          </div>
          <div className={cn(card.stat, 'flex flex-col gap-1')}>
            <span className="text-2xl font-bold text-red-600">{summary.absences}</span>
            <span className={typography.small}>Absences totales</span>
          </div>
        </div>
      )}

      {/* Historique récent */}
      {summary && summary.recentAbsences.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Clock className="size-4 text-text-subtle" strokeWidth={1.5} />
            <h2 className={cn(typography.label, 'font-semibold')}>Absences récentes</h2>
          </div>
          <div className="flex flex-col gap-2">
            {summary.recentAbsences.map((a) => (
              <div key={a.id} className={cn(card.base, 'flex items-center justify-between gap-3 py-2.5')}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{a.schedule.course.name}</p>
                  <p className={typography.small}>{formatDate(a.schedule.startTime)}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0', ATTENDANCE_STATUS_CLS[a.status] ?? 'bg-muted text-text-subtle')}>
                  {ATTENDANCE_STATUS_LABEL[a.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info complémentaire */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="size-4 text-text-subtle" strokeWidth={1.5} />
          <h2 className={cn(typography.label, 'font-semibold')}>Informations</h2>
        </div>
        <div className={cn(card.soft, 'grid grid-cols-2 gap-3 text-sm')}>
          {student.user.dateOfBirth && (
            <div className="flex flex-col gap-0.5">
              <span className={typography.small}>Date de naissance</span>
              <span className="font-medium text-text-primary">{formatDate(student.user.dateOfBirth)}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className={typography.small}>Sexe</span>
            <span className="font-medium text-text-primary">{student.user.sex ?? '—'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={typography.small}>Inscrit le</span>
            <span className="font-medium text-text-primary">{formatDate(student.enrolledAt)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={typography.small}>Statut</span>
            <span className="font-medium text-text-primary">{student.user.status}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
