// src/components/personal/teacher/section/TeacherDailyOverview.tsx
// components/personal/teacher/section/TeacherDailyOverview.tsx
import type { ReactNode } from 'react'
import { ScheduleCard, type ScheduleCardSchedule } from '@/components/personal/teacher/ui/ScheduleCard'
import type { ScheduleIcon } from '@/components/personal/teacher/ui/ScheduleStatusIcon'
import { TeacherDailyScheduleCount } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'

type Props<S extends ScheduleCardSchedule> = {

  /** Cours restants / total de la journée (ex. 2/3), en pastille dans le coin haut droit. */
  count?: Pick<TeacherDailyScheduleCount, 'remaining' | 'total'>
  /** Séance à afficher (en cours, sinon la prochaine), ou null s'il n'en reste plus. */
  schedule: S | null
  /** Slot d'en-tête de la section : contenu libre fourni par le parent, ou rien. */
  header?: ReactNode
  /** Slot au-dessus de la carte : décompte fourni par le parent. */
  countdown?: ReactNode
  /** Icône dans le cercle de la carte, résolue par le parent. Absent = cercle plein. */
  icon?: ScheduleIcon
  /** Slot sous la carte : action fournie par le parent (ex. démarrer la séance). */
  action?: ReactNode
  onScheduleClick?: (schedule: S) => void
}

/**
 * Mise en page de la vue du jour : aucune règle d'affichage ici.
 * Tout ce qui varie (en-tête, décompte, action) arrive en slot depuis le parent.
 */
export function TeacherDailyOverview<S extends ScheduleCardSchedule>({
  schedule,
  header,
  countdown,
  count,
  icon,
  action,
  onScheduleClick,
}: Props<S>) {
  return (
    <section className="flex flex-1 flex-col -mt-20 items-center justify-center gap-24 bg-background border px-4">

      {count && (
        <p className="absolute right-4 top-4 rounded-xs bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          <span aria-hidden>
            {count.remaining}/{count.total}
          </span>
          <span className="sr-only">
            {count.remaining} cours restants sur {count.total} aujourd&apos;hui
          </span>
        </p>
      )}

      {header}

      {schedule ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-5">
          {countdown}
          <ScheduleCard
            schedule={schedule}
            icon={icon}
            onClick={() => onScheduleClick?.(schedule)}
          />
          {action}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun cours en attente aujourd&apos;hui</p>
      )}
    </section>
  )
}