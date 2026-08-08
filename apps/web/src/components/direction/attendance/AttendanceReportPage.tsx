'use client'
import { useRouter, usePathname } from 'next/navigation'
import { BarChart3, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { card, typography } from '@/styles'
import type { getAttendanceReportAction } from '@/services/attendance'
import type { ClassItem } from '@/services/class'

type ReportRow = Extract<Awaited<ReturnType<typeof getAttendanceReportAction>>, { data: unknown }>['data'][number]

const PERIODS = [
  { value: 'all',   label: 'Toute la période' },
  { value: 'month', label: 'Ce mois'           },
  { value: 'week',  label: 'Cette semaine'      },
  { value: 'today', label: "Aujourd'hui"        },
] as const

function riskLevel(rate: number | null): 'high' | 'medium' | 'low' | 'none' {
  if (rate === null) return 'none'
  if (rate < 70)   return 'high'
  if (rate < 85)   return 'medium'
  return 'low'
}

const RISK_BADGE: Record<string, string> = {
  high:   'bg-red-500/10 text-red-600',
  medium: 'bg-orange-500/10 text-orange-500',
  low:    'bg-green-500/10 text-green-600',
  none:   'bg-muted text-text-subtle',
}

const RISK_LABEL: Record<string, string> = {
  high:   '⚠ À risque',
  medium: '⚡ Vigilance',
  low:    '✓ Régulier',
  none:   '—',
}

function RiskIcon({ level }: { level: string }) {
  if (level === 'high')   return <TrendingDown className="size-3.5 text-red-500 shrink-0" />
  if (level === 'medium') return <Minus        className="size-3.5 text-orange-500 shrink-0" />
  return <TrendingUp className="size-3.5 text-green-600 shrink-0" />
}

export function AttendanceReportPage({
  rows,
  classes,
  currentPeriod,
  currentClassId,
}: {
  rows: ReportRow[]
  classes: ClassItem[]
  currentPeriod: string
  currentClassId?: string
}) {
  const router  = useRouter()
  const pathname = usePathname()

  function navigate(params: { period?: string; classId?: string }) {
    const sp = new URLSearchParams()
    if (params.period && params.period !== 'all') sp.set('period', params.period)
    if (params.classId) sp.set('classId', params.classId)
    router.push(`${pathname}?${sp.toString()}`)
  }

  const atRisk = rows.filter((r) => riskLevel(r.rate) === 'high').length
  const total  = rows.length

  return (
    <div className="flex flex-col gap-4">
      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={cn(card.stat, 'flex items-center gap-3')}>
          <BarChart3 className="size-5 text-primary shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-lg font-semibold text-text-primary">{total}</p>
            <p className={typography.small}>Étudiants suivis</p>
          </div>
        </div>
        <div className={cn(card.stat, 'flex items-center gap-3')}>
          <TrendingDown className="size-5 text-red-500 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-lg font-semibold text-red-600">{atRisk}</p>
            <p className={typography.small}>À risque (&lt;70%)</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={currentPeriod} onValueChange={(v) => navigate({ period: v, classId: currentClassId })}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentClassId ?? 'all'}
          onValueChange={(v) => navigate({ period: currentPeriod, classId: v === 'all' ? undefined : v })}
        >
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
          {rows.length} étudiant{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      {rows.length === 0 ? (
        <div className={cn(card.soft, 'py-12 text-center')}>
          <p className={typography.body}>Aucune donnée d'assiduité pour cette période.</p>
          <p className={typography.small}>Les données apparaissent après la clôture des séances.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/40">
                <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Étudiant</th>
                <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium hidden sm:table-cell')}>Classe</th>
                <th className={cn(typography.label, 'px-4 py-2.5 text-right font-medium')}>Taux</th>
                <th className={cn(typography.label, 'px-4 py-2.5 text-right font-medium hidden md:table-cell')}>Absences</th>
                <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const level = riskLevel(r.rate)
                const name  = [r.firstName, r.lastName].filter(Boolean).join(' ') || '—'
                return (
                  <tr key={r.studentId} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">{name}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                      {r.className ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        'font-semibold',
                        level === 'high'   ? 'text-red-600'    :
                        level === 'medium' ? 'text-orange-500' :
                        'text-green-600'
                      )}>
                        {r.rate !== null ? `${r.rate}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary hidden md:table-cell">
                      {r.absences}/{r.denominator}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <RiskIcon level={level} />
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', RISK_BADGE[level])}>
                          {RISK_LABEL[level]}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
