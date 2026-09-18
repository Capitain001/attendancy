'use client'

import type { ScheduleItem } from './types'
import { ScheduleListItem } from './ScheduleListItem'

interface ScheduleListSectionProps {
  title: string
  schedules: ScheduleItem[]
  selectedId?: string | null
  onSelect: (id: string) => void
  defaultOpen?: boolean
}

export function ScheduleListSection({
  title,
  schedules,
  selectedId,
  onSelect,
  defaultOpen = true,
}: ScheduleListSectionProps) {
  return (
    <details open={defaultOpen} className="group space-y-1">
      <summary className="cursor-pointer select-none text-xs font-mono uppercase tracking-wider text-teacher-muted mb-2 inline-flex items-center list-none [&::-webkit-details-marker]:hidden">
        <span className="border-b border-dashed border-teacher-surface-muted pb-0.5 hover:text-teacher-fg transition-colors">
          {title}
        </span>
      </summary>

      <div className="space-y-1">
        {schedules.map((schedule) => (
          <ScheduleListItem
            key={schedule.id}
            schedule={schedule}
            isSelected={schedule.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </details>
  )
}
