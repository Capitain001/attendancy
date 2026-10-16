// components/teacher/personal/section/TeacherDailyOverview.tsx
import type { ReactNode } from 'react'
import { cn, formatDuration, formatTime } from '@/lib/utils'
import { ScheduleStatusIcon, type ScheduleIconVariant } from '@/components/teacher/personal/ui/ScheduleStatusIcon'

/** Ce dont la carte a besoin ; le callback reçoit l'objet complet (S). */
type OverviewSchedule = {
  id?: string
  startTime: Date
  endTime: Date
  course: { name: string }
  /** Variant d'icône résolu par le parent. Absent = pas d'icône. */
  iconVariant?: ScheduleIconVariant
}

type Props<S extends OverviewSchedule> = {
  /** `count.remaining` : séances ONGOING + PENDING (en cours incluse). */
  remaining: number
  /** Séance à afficher (en cours, sinon la prochaine), ou null s'il n'en reste plus. */
  schedule: S | null
  /** Slot au-dessus de la carte : décompte fourni par le parent. */
  countdown?: ReactNode
  onScheduleClick?: (schedule: S) => void
}

export function TeacherDailyOverview<S extends OverviewSchedule>({
  remaining,
  schedule,
  countdown,
  onScheduleClick,
}: Props<S>) {
  return (
    <section className="flex flex-1 flex-col -mt-20 items-center justify-center gap-24 bg-background border px-4">
      <RemainingCircle count={remaining} />

      {schedule ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          {countdown}
          <ScheduleCard schedule={schedule} onClick={() => onScheduleClick?.(schedule)} />
        </div>
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
  onClick,
}: {
  schedule: OverviewSchedule
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
        'flex w-full cursor-pointer items-center gap-4 rounded-md border border-foreground/60 bg-foreground/[0.01] p-4 transition-colors hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      {/* {schedule.iconVariant && (
        <ScheduleStatusIcon variant={schedule.iconVariant} className="size-5 shrink-0" />
      )} */}

      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground p-[2px]">
        <ScheduleStatusIcon variant="warning" className="text-background" />
      </div>


      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{schedule.course.name}</p>
        <p className="text-sm text-muted-foreground">{formatTime(schedule.startTime)}</p>
      </div>

      <p className="shrink-0 text-lg text-foreground">
        {formatDuration(schedule.startTime, schedule.endTime)}
      </p>
    </div>
  )
}