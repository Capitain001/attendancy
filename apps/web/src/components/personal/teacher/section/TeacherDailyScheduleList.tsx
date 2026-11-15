// src/components/personal/teacher/section/TeacherDailyScheduleList.tsx
import { cn, formatDuration, formatTime } from '@/lib/utils'
import { scheduleListMessages as m } from '@/lib/data/schedule'
import type { ScheduleUiStatus } from '@/services/schedule/policy'
import type { ScheduleCardSchedule } from '@/components/personal/teacher/ui/ScheduleCard'
import { resolveScheduleIcon } from '@/components/personal/teacher/ui/ScheduleStatusIcon'

type ListSchedule = ScheduleCardSchedule & {
  id: string
  session: { id: string } | null
}

type Item<S extends ListSchedule> = { schedule: S; status: ScheduleUiStatus }

type Props<S extends ListSchedule> = {
  /** Séances dans l'ordre chronologique, avec leur statut UI résolu par le parent. */
  items: Item<S>[]
  onScheduleClick?: (schedule: S) => void
}

/** Statuts d'une séance terminée : affichée grisée. */
const PAST_STATUSES: ReadonlySet<ScheduleUiStatus> = new Set(['COMPLETED', 'MISSED', 'CANCELED'])

export function TeacherDailyScheduleList<S extends ListSchedule>({
  items,
  onScheduleClick,
}: Props<S>) {
  const nextIndex = items.findIndex(({ status }) => !PAST_STATUSES.has(status))

  // Dépliable seulement s'il y a des séances passées ET une prochaine séance
  const hasToggle = nextIndex > 0
  const past = hasToggle ? items.slice(0, nextIndex) : []
  const rest = hasToggle ? items.slice(nextIndex) : items

  // Compteur : séances maintenues (hors annulées), dont celles dont le créneau est terminé
  const total = items.filter(({ status }) => status !== 'CANCELED').length
  const done = items.filter(({ status }) => status === 'COMPLETED' || status === 'MISSED').length

  const renderRow = ({ schedule, status }: Item<S>, isNext: boolean) => {
    // Règle centralisée : fenêtre en cours sans session = le cours devrait avoir commencé
    const needsStart = resolveScheduleIcon(status, schedule.session !== null) === 'warning'

    return (
      <li
        key={schedule.id}
        className={cn(
          PAST_STATUSES.has(status) && 'opacity-50',
          isNext && 'rounded-sm bg-foreground/[0.06] transition-colors hover:bg-foreground/10',
        )}
      >
        <button
          type="button"
          onClick={() => onScheduleClick?.(schedule)}
          className={cn(
            'flex w-full cursor-pointer items-baseline gap-4 px-3 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
            status === 'CANCELED' && 'line-through',
          )}
        >
          <span
            className={cn(
              'shrink-0 text-sm tabular-nums text-muted-foreground',
              needsStart && 'font-medium text-destructive',
            )}
          >
            {formatTime(schedule.startTime)}
          </span>
          <span className="min-w-0 flex-1 text-foreground">{schedule.course.name}</span>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {formatDuration(schedule.startTime, schedule.endTime)}
          </span>
        </button>
      </li>
    )
  }

  const progress = m.progress(done, total)

  return (
    <section className="group/past flex flex-1 flex-col gap-10 bg-background px-4 py-8">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-center text-2xl font-semibold text-foreground">{m.title}</h1>

        {total > 0 &&
          (hasToggle ? (
            // Le compteur est le déclencheur : il déplie les séances passées
            <label className="cursor-pointer text-sm tabular-nums text-muted-foreground  transition-colors hover:text-foreground has-[input:focus-visible]:text-foreground">
              <input type="checkbox" className="sr-only" />
              {progress}
            </label>
          ) : (
            <p className="text-sm tabular-nums text-muted-foreground">{progress}</p>
          ))}
      </header>

      {items.length > 0 ? (
        // -mx-3 compense le px-3 des lignes : le texte reste aligné avec le titre
        <div className="-mx-3 flex flex-col">
          {hasToggle && (
            // Séances passées : masquées par défaut, hauteur animée, sans JS
            <div
              className={cn(
                'invisible grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none',
                'group-has-[input:checked]/past:visible group-has-[input:checked]/past:grid-rows-[1fr] group-has-[input:checked]/past:opacity-100',
              )}
            >
              <ul className="flex min-h-0 flex-col divide-y divide-dashed overflow-hidden">
                {past.map((item) => renderRow(item, false))}
              </ul>
            </div>
          )}

          <ul
            className={cn(
              'flex flex-col divide-y divide-dashed',
              // Filet entre le bloc déplié et la première séance restante
              hasToggle &&
                'group-has-[input:checked]/past:border-t group-has-[input:checked]/past:border-dashed',
            )}
          >
            {rest.map((item, i) => renderRow(item, nextIndex !== -1 && i === 0))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-2xl font-medium text-foreground">{m.empty}</p>
      )}
    </section>
  )
}