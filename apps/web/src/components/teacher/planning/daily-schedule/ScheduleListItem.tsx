'use client'

import { STATUS_CONFIG, type ScheduleItem } from './types'
import { formatRange } from './format'

interface ScheduleListItemProps {
  schedule: ScheduleItem
  isSelected: boolean
  onSelect: (id: string) => void
}

export function ScheduleListItem({ schedule, isSelected, onSelect }: ScheduleListItemProps) {
  const status = STATUS_CONFIG[schedule.status]

  return (
    <button
      type="button"
      onClick={() => onSelect(schedule.id)}
      className={`group/btn flex h-10 w-full shrink-0 items-center gap-3 rounded-lg px-4 text-sm transition-colors ${
        isSelected
          ? 'bg-foreground/10 text-foreground'
          : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground/70'
      }`}
    >
      <span className="shrink-0 font-mono text-xs tabular-nums">{formatRange(schedule)}</span>

      <span className="h-px flex-1 bg-foreground/10" />

      <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>
        {schedule.course.name}
      </span>

      <span className="shrink-0 text-xs text-foreground/40">{schedule.room.name}</span>

      <span aria-label={status.label} className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dot}`} />
    </button>
  )
}