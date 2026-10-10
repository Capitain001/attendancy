// components/teacher/personal/section/TeacherDailyOverview.tsx
import { cn, formatDuration, timeFormatter } from '@/lib/utils'

/** Ce dont la carte a besoin ; le callback reçoit l'objet complet (S). */
type OverviewSchedule = {
  id?: string
  startTime: Date
  endTime: Date
  course: { name: string }
}

type Props<S extends OverviewSchedule> = {
  /** `count.remaining` : séances ONGOING + PENDING (en cours incluse). */
  remaining: number
  ongoing: S | null
  upcoming: S | null
  onScheduleClick?: (schedule: S) => void
}

export function TeacherDailyOverview<S extends OverviewSchedule>({
  remaining,
  ongoing,
  upcoming,
  onScheduleClick,
}: Props<S>) {
  // Cours actuel s'il existe, sinon le prochain
  const schedule = ongoing ?? upcoming

  return (
    <section className="flex flex-1 flex-col -mt-20 items-center justify-center gap-24 bg-background border px-4">
      <RemainingCircle count={remaining} />

      {schedule ? (
        <ScheduleCard
          schedule={schedule}
          isOngoing={ongoing !== null}
          onClick={() => onScheduleClick?.(schedule)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Plus de cours aujourd&apos;hui</p>
      )}
    </section>
  )
}

function RemainingCircle({ count }: { count: number }) {
  return (
    <div className="relative flex size-40 items-center justify-center rounded-full bg-muted">
      {/* Bordure SVG personnalisée */}
      <svg className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="48%"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          /* 6px de tiret, 6px d'espace */
          strokeDasharray="6 6"
          className="text-muted-foreground/50"
        />
      </svg>

      <p className="text-6xl font-light tabular-nums text-foreground">
        {String(count).padStart(2, '0')}
        <span className="sr-only"> cours restants</span>
      </p>
    </div>
  )
}

function ScheduleCard({
  schedule,
  isOngoing,
  onClick,
}: {
  schedule: OverviewSchedule
  isOngoing: boolean
  onClick?: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        'flex w-full max-w-sm cursor-pointer items-center gap-4 rounded-md border border-foreground/60 bg-foreground/[0.01] p-4 transition-colors hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div aria-hidden="true" className="size-10 shrink-0 rounded-full bg-foreground" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {schedule.course.name}
          <span className="sr-only">{isOngoing ? ' (en cours)' : ' (à venir)'}</span>
        </p>
        <p className="text-sm text-muted-foreground">{timeFormatter.format(schedule.startTime)}</p>
      </div>

      <p className="shrink-0 text-lg text-foreground">
        {formatDuration(schedule.startTime, schedule.endTime)}
      </p>
    </div>
  )
}