import { connection } from 'next/server'
import { getOrgTodayAbsencesAction } from '@/services/attendance'
import { typography } from '@/styles'
import { card } from '@/styles'
import { cn } from '@/lib/utils'
import { BarChart3, User } from 'lucide-react'

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function AttendanceReportsPage() {
  await connection()

  const result = await getOrgTodayAbsencesAction()

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  type AbsenceItem = {
    id: string
    student: { user: { firstName: string | null; lastName: string | null } }
    schedule: {
      startTime: Date
      course: { name: string }
      class: { name: string } | null
      group: { name: string } | null
    }
  }
  const absences = result.data as unknown as AbsenceItem[]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Rapports d'assiduité</h1>
        <span className={typography.small}>Aujourd'hui</span>
      </div>

      <div className={cn(card.stat, 'flex items-center gap-3')}>
        <BarChart3 className="size-5 text-red-500" strokeWidth={1.5} />
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-text-primary">{absences.length}</span>
          <span className={typography.small}>Absence{absences.length !== 1 ? 's' : ''} du jour</span>
        </div>
      </div>

      {absences.length === 0 ? (
        <div className={cn(card.soft, 'py-8 text-center')}>
          <p className={typography.body}>Aucune absence enregistrée aujourd'hui.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/40">
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Étudiant</th>
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Cours</th>
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Classe</th>
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Heure</th>
              </tr>
            </thead>
            <tbody>
              {absences.map((a) => {
                const name = [a.student.user.firstName, a.student.user.lastName].filter(Boolean).join(' ')
                return (
                  <tr key={a.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-text-subtle" strokeWidth={1.5} />
                        <span className="font-medium text-text-primary">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{a.schedule.course.name}</td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                      {a.schedule.class?.name ?? a.schedule.group?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                      {formatTime(a.schedule.startTime)}
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
