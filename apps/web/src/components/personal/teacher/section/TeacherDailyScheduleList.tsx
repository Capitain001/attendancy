// components/personal/teacher/section/TeacherDailyScheduleList.tsx
import { ChevronsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { scheduleListMessages as m } from '@/lib/data/schedule'
import type { ScheduleUiStatus } from '@/services/schedule/policy'
import { ScheduleCard, type ScheduleCardSchedule } from '@/components/personal/teacher/ui/ScheduleCard'
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

  // Repliable seulement s'il y a des séances passées ET une prochaine séance
  const hasToggle = nextIndex > 0
  const past = hasToggle ? items.slice(0, nextIndex) : []
  const rest = hasToggle ? items.slice(nextIndex) : items

  const renderCard = ({ schedule, status }: Item<S>, isNext: boolean) => (
    <li key={schedule.id} className="py-1">
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
  )

  return (
    <section className="flex flex-1 flex-col gap-8 px-4 py-6 bg-background">
      <h1 className="text-center text-2xl font-semibold text-foreground">{m.title}</h1>

      {items.length > 0 ? (
        <div className="group flex flex-col">
          {hasToggle && (
            <>
              {/* Séances passées : masquées quand le checkbox est décoché */}
              {/* Séances passées : hauteur animée, sans JS */}
              <div
                className={cn(
                  'grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none',
                  'group-has-[input:not(:checked)]:invisible group-has-[input:not(:checked)]:grid-rows-[0fr] group-has-[input:not(:checked)]:opacity-0',
                )}
              >
                <ul className="flex min-h-0 flex-col overflow-hidden">
                  {past.map((item) => renderCard(item, false))}
                </ul>
              </div>

              {/* Séparateur = bouton de repli, à sa place d'origine */}
              <label
                className="flex w-full cursor-pointer items-center justify-center py-4"
                aria-label="Afficher ou masquer les séances passées"
              >
                <input type="checkbox" defaultChecked className="sr-only" />
                <ChevronsDown
                  size={24}
                  strokeWidth={1.5}
                  className="text-muted-foreground/40 transition-transform duration-200 group-has-[input:not(:checked)]:rotate-180"
                />
              </label>
            </>
          )}

          <ul className="flex flex-col">
            {rest.map((item, i) => renderCard(item, nextIndex !== -1 && i === 0))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">{m.empty}</p>
      )}
    </section>
  )
}