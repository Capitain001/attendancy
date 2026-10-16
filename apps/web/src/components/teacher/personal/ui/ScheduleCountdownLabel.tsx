// components/teacher/personal/section/ScheduleCountdownLabel.tsx
'use client'

import {
  useScheduleCountdownLabel,
  type CountdownSchedule,
} from '@/hooks/data/schedule/useScheduleCountdownLabel'

type Props = {
  schedule: CountdownSchedule | null
  isOngoing: boolean
}

export function ScheduleCountdownLabel({ schedule, isOngoing }: Props) {
  const countdown = useScheduleCountdownLabel(schedule, isOngoing)
  if (!countdown) return null

  return (
    <p className="flex flex-wrap justify-center gap-1 text-sm text-muted-foreground">
      <span>{countdown.message}</span>
      {countdown.time && (
        <span className="font-medium text-foreground">{countdown.time}</span>
      )}
    </p>
  )
}