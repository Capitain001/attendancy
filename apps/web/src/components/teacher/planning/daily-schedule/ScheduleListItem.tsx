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
      className={`group/btn w-full flex items-center justify-between p-3 rounded-lg text-sm text-left transition-colors ${
        isSelected ? 'bg-muted font-medium' : 'hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-xs font-mono text-teacher-muted w-24 shrink-0">{formatRange(schedule)}</span>
        <span className="truncate text-teacher-fg">{schedule.course.name}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-xs text-teacher-muted">
        <span>{schedule.room.name}</span>
        <span aria-label={status.label} className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
      </div>
    </button>
  )
}
