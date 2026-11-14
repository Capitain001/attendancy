// src/components/personal/teacher/ui/ScheduleSummary.tsx
import { ChevronRight } from 'lucide-react'
import { formatDuration, formatTime } from '@/lib/utils'
import type { TeacherDailyScheduleCount } from '@/hooks/data/schedule/useTeacherDailyScheduleStats'

/** Ce dont le résumé a besoin. */
export type ScheduleSummarySchedule = {
  id?: string
  startTime: Date
  endTime: Date
  course: { name: string }
}

type Props = {
  schedule: ScheduleSummarySchedule
  /** Cours restants / total (ex. 2/3), affiché discrètement au-dessus du titre. Absent = rien. */
  count?: Pick<TeacherDailyScheduleCount, 'remaining' | 'total'>
  /** Déclenché par le clic sur le titre. */
  onOpen?: () => void
}

/**
 * Résumé d'un cours : cours restants / total, titre, horaires.
 * Aucune bordure, uniquement de la typographie.
 * Le titre est le déclencheur du détail (bouton natif : clavier et lecteur d'écran gratuits).
 */
export function ScheduleSummary({ schedule, count, onOpen }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {count && (
        <p className="text-xs font-medium tracking-widest tabular-nums text-muted-foreground">
          {/* Version visuelle compacte, et version lue par les lecteurs d'écran */}
          <span aria-hidden>
            {count.remaining}/{count.total}
          </span>
          <span className="sr-only">
            {count.remaining} cours restants sur {count.total} aujourd&apos;hui
          </span>
        </p>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="group inline-flex max-w-full items-center gap-1 rounded-sm text-2xl font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* text-balance : un nom long se répartit sur deux lignes sans orphelin */}
        <span className="text-balance">{schedule.course.name}</span>
        {/* Indice « cliquable » : le chevron avance d'un cran au survol */}
        <ChevronRight
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
        <span className="sr-only"> : voir le détail</span>
      </button>

      <p className="text-sm tabular-nums text-muted-foreground">
        {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)} ·{' '}
        {formatDuration(schedule.startTime, schedule.endTime)}
      </p>
    </div>
  )
}