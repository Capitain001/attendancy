// components/teacher/personal/ui/ScheduleCard.tsx
import { cn, formatDuration, formatTime } from '@/lib/utils'
import { ScheduleStatusIcon, type ScheduleIcon } from '@/components/teacher/personal/ui/ScheduleStatusIcon'

/** Ce dont la carte a besoin. */
export type ScheduleCardSchedule = {
  id?: string
  startTime: Date
  endTime: Date
  course: { name: string }
}

type Props = {
  schedule: ScheduleCardSchedule
  /** Icône dans le cercle. Absent = cercle plein. */
  icon?: ScheduleIcon
  /** Fusionné en dernier (twMerge) : permet de surcharger le style, ex. `border-0`. */
  className?: string
  onClick?: () => void
}

export function ScheduleCard({ schedule, icon, className, onClick }: Props) {
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
        className,
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground ">
        {icon && <ScheduleStatusIcon icon={icon} className="text-background" />}
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