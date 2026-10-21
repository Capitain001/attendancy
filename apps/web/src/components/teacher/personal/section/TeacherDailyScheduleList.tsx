// components/teacher/personal/section/TeacherDailyScheduleList.tsx
import { Fragment } from 'react'
import { ChevronsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { scheduleListMessages as m } from '@/lib/data/schedule'
import type { ScheduleUiStatus } from '@/services/schedule/policy'
import { ScheduleCard, type ScheduleCardSchedule } from '@/components/teacher/personal/ui/ScheduleCard'
import { resolveScheduleIcon } from '@/components/teacher/personal/ui/ScheduleStatusIcon'

type ListSchedule = ScheduleCardSchedule & {
  id: string
  session: { id: string } | null
}

type Props<S extends ListSchedule> = {
  /** Séances dans l'ordre chronologique, avec leur statut UI résolu par le parent. */
  items: { schedule: S; status: ScheduleUiStatus }[]
  onScheduleClick?: (schedule: S) => void
}

/** Statuts d'une séance terminée : affichée grisée. */
const PAST_STATUSES: ReadonlySet<ScheduleUiStatus> = new Set(['COMPLETED', 'MISSED', 'CANCELED'])

export function TeacherDailyScheduleList<S extends ListSchedule>({
  items,
  onScheduleClick,
}: Props<S>) {
  // Prochain cours : première séance non passée (en cours ou à venir, démarrée ou non).
  // Le séparateur s'insère juste avant elle, et sa carte est mise en avant.
  const nextIndex = items.findIndex(({ status }) => !PAST_STATUSES.has(status))

  return (
    <section className="flex flex-1 flex-col gap-8 px-4 py-6 bg-background">
      <h1 className="text-center text-2xl font-semibold text-foreground">{m.title}</h1>

      {items.length > 0 ? (
        <ul className="flex flex-col">
          {items.map(({ schedule, status }, index) => {
            const isNext = index === nextIndex

            return (
              <Fragment key={schedule.id}>
                {/* Séparateur : seulement s'il y a au moins une séance passée avant */}
                {isNext && index > 0 && (
                  <li className="flex w-full items-center justify-center py-4" aria-hidden="true">
                    <ChevronsDown
                      size={24}
                      strokeWidth={1.5}
                      className="text-muted-foreground/40" // Couleur subtile pour coller au design
                    />
                  </li>
                )}

                <li className="py-1">
                  <ScheduleCard
                    schedule={schedule}
                    icon={resolveScheduleIcon(status, schedule.session !== null)}
                    className={cn(
                      'border-0',
                      PAST_STATUSES.has(status) && 'opacity-50',
                      isNext && 'bg-foreground/[0.08] hover:bg-foreground/12',
                    )}
                    onClick={() => onScheduleClick?.(schedule)}
                  />
                </li>
              </Fragment>
            )
          })}
        </ul>
      ) : (
        <p className="text-center text-sm text-muted-foreground">{m.empty}</p>
      )}
    </section>
  )
}