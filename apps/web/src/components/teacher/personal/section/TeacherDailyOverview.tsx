// components/teacher/personal/section/TeacherDailyOverview.tsx
import type { ReactNode } from 'react'
import { ScheduleCard, type ScheduleCardSchedule } from '@/components/teacher/personal/ui/ScheduleCard'
import type { ScheduleIcon } from '@/components/teacher/personal/ui/ScheduleStatusIcon'

type Props<S extends ScheduleCardSchedule> = {
  /** `count.remaining` : séances ONGOING + PENDING (en cours incluse). */
  remaining: number
  /** Séance à afficher (en cours, sinon la prochaine), ou null s'il n'en reste plus. */
  schedule: S | null
  /** Slot au-dessus de la carte : décompte fourni par le parent. */
  countdown?: ReactNode
  /** Icône dans le cercle de la carte, résolue par le parent. Absent = cercle plein. */
  icon?: ScheduleIcon
  onScheduleClick?: (schedule: S) => void
}

export function TeacherDailyOverview<S extends ScheduleCardSchedule>({
  remaining,
  schedule,
  countdown,
  icon,
  onScheduleClick,
}: Props<S>) {
  return (
    <section className="flex flex-1 flex-col -mt-20 items-center justify-center gap-24 bg-background border px-4">
      <RemainingCircle count={remaining} />

      {schedule ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          {countdown}
          <ScheduleCard
            schedule={schedule}
            icon={icon}
            onClick={() => onScheduleClick?.(schedule)}
          />
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