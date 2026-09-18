'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
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
    <details open={defaultOpen} className="group">
      <summary className="mb-2 inline-flex cursor-pointer select-none list-none items-center text-xs text-foreground/40 [&::-webkit-details-marker]:hidden">
        <span className="border-b border-dashed border-foreground/20 pb-0.5 transition-colors hover:text-foreground/70">
          {title}
        </span>
        <span className="ml-2 text-foreground/20">({schedules.length})</span>
      </summary>

      <div className="rounded-xl border border-foreground/10">
        <ScrollArea className="max-h-72">
          <div className="space-y-1 p-1">
            {schedules.map((schedule) => (
              <ScheduleListItem
                key={schedule.id}
                schedule={schedule}
                isSelected={schedule.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </details>
  )
}