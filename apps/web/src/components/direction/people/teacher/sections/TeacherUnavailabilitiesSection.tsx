import { AlertCircle } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetTeacherUnavailabilitiesDto } from '@/services/teacher-unavailability'

const DAYS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']

const UNAVAIL_LABEL: Record<string, string> = {
  WEEKLY: 'Hebdomadaire',
  DATE_RANGE: 'Plage de dates',
  ONE_TIME: 'Ponctuel',
}

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function TeacherUnavailabilitiesSection({
  unavailabilities,
}: {
  unavailabilities: GetTeacherUnavailabilitiesDto | []
}) {
  return (
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
                  <p className={typography.small}>
                    {formatDate(u.startDate)}{u.endDate ? ` → ${formatDate(u.endDate)}` : ''}
                  </p>
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
  )
}
