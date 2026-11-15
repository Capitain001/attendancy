// src/components/personal/teacher/section/TeacherDailyOverview.tsx
// components/personal/teacher/section/TeacherDailyOverview.tsx
import type { ReactNode } from 'react'
import type { ScheduleCardSchedule } from '@/components/personal/teacher/ui/ScheduleCard'
import type { TeacherDailyScheduleCount } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'
import { formatTime } from '@/lib/date'

type Props<S extends ScheduleCardSchedule> = {
  /** Cours restants / total de la journée (ex. 2/3), en pastille dans le coin haut droit. */
  count?: Pick<TeacherDailyScheduleCount, 'remaining' | 'total'>
  /** Séance à afficher (en cours, sinon la prochaine), ou null s'il n'en reste plus. */
  schedule: S | null
  /** Slot sous le titre : décompte fourni par le parent (libellé ou timer). */
  countdown?: ReactNode
  /** Slot en bas : action fournie par le parent (ex. démarrer la séance). */
  action?: ReactNode
  /** Ouverture du détail. Pas encore branché : prévu pour le bouton info. */
  onScheduleClick?: (schedule: S) => void
}

/**
 * Mise en page de la vue du jour : aucune règle d'affichage ici.
 * Tout ce qui varie (décompte, action) arrive en slot depuis le parent.
 */
export function TeacherDailyOverview<S extends ScheduleCardSchedule>({
  schedule,
  countdown,
  onScheduleClick,
  count,
  action,
}: Props<S>) {
  return (
    // relative : ancre la pastille `absolute` à la section
    <section className="relative flex flex-1 flex-col items-center justify-start bg-background border px-4 gap-y-16 pt-16">
      {count && (
        <p className="absolute right-4 top-4 rounded-xs bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {/* Version visuelle compacte, et version lue par les lecteurs d'écran */}
          <span aria-hidden>
            {count.remaining}/{count.total}
          </span>
          <span className="sr-only">
            {count.remaining} cours restants sur {count.total} aujourd&apos;hui
          </span>
        </p>
      )}

      {schedule ? (
        <>
          <div className="min-w-0 uppercase leading-tight text-xl" onClick={() => onScheduleClick?.(schedule)}>
            <p className="truncate font-medium text-foreground">{schedule.course.name}</p>
            <span className="inline-block w-full text-sm text-center text-muted-foreground">
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </span>
          </div>

          <div className="flex flex-col justify-between flex-1 items-center w-full pt-8">
          {countdown}


            {action}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun cours en attente aujourd&apos;hui</p>
      )}
    </section>
  )
}