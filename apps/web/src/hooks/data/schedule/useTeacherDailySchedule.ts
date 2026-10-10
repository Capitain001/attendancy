// apps/web/src/hooks/data/schedule/useTeacherDailySchedule.ts
'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toDayKey } from '@/lib/date'
import { teacherDailyScheduleQuery } from '@/services/schedule/queries'


interface UseTeacherDailyScheduleProps {
  teacherId?: string
  date?: Date
}

export const useTeacherDailySchedule = ({ teacherId, date }: UseTeacherDailyScheduleProps = {}) => {
  const dayKey = toDayKey(date ?? new Date())

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    ...teacherDailyScheduleQuery({ teacherId, dayKey }),
  })

  // Référence stable + tri chronologique (la DB trie déjà, c'est une garantie)
  const schedules = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [data],
  )

  return { schedules, dayKey, isLoading, isFetching, error, refetch }
}