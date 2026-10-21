// apps/web/src/hooks/data/schedule/useTeacherDailyScheduleList.ts
'use client'

import { useMemo } from 'react'
import { resolveScheduleUiStatus, type DBSchedule } from '@/services/schedule/policy'
import { useScheduleClock } from './useScheduleClock'

/**
 * Séances de la journée avec leur statut UI résolu (statut DB + horloge),
 * dans l'ordre reçu. Attend des `schedules` triés par startTime
 * (garanti par useTeacherDailySchedule) : les séances passées arrivent donc en premier.
 *
 * Se met à jour aux frontières startTime / endTime via useScheduleClock.
 */
export function useTeacherDailyScheduleList<T extends DBSchedule>(schedules: T[]) {
  const now = useScheduleClock(schedules)

  return useMemo(
    () => schedules.map((schedule) => ({ schedule, status: resolveScheduleUiStatus(schedule, now) })),
    [schedules, now],
  )
}