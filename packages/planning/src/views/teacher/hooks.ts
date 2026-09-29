'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { addMonths, subMonths, format } from 'date-fns'
import { apiFetch } from '../../lib/api-client'
import type { TeacherScheduleItemDto } from '@attendancy/types'

export function useTeacherScheduleDays({ visibleMonth }: { visibleMonth: Date }) {
  const queryClient = useQueryClient()
  const monthKey = format(visibleMonth, 'yyyy-MM')

  const query = useQuery({
    queryKey: ['teacher', 'schedule-days', monthKey],
    queryFn: () => apiFetch<string[]>(`/api/teacher/schedule-days?month=${monthKey}`),
    staleTime: 5 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    const prev = format(subMonths(visibleMonth, 1), 'yyyy-MM')
    const next = format(addMonths(visibleMonth, 1), 'yyyy-MM')

    queryClient.prefetchQuery({
      queryKey: ['teacher', 'schedule-days', prev],
      queryFn: () => apiFetch<string[]>(`/api/teacher/schedule-days?month=${prev}`),
    })
    queryClient.prefetchQuery({
      queryKey: ['teacher', 'schedule-days', next],
      queryFn: () => apiFetch<string[]>(`/api/teacher/schedule-days?month=${next}`),
    })
  }, [monthKey, queryClient, visibleMonth])

  return useMemo(() => new Set(query.data ?? []), [query.data])
}

export function useTeacherDaySchedules({ date }: { date: Date }) {
  const dayKey = format(date, 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['teacher', 'day-schedules', dayKey],
    queryFn: () => {
      const from = new Date(date)
      from.setHours(0, 0, 0, 0)
      const to = new Date(date)
      to.setHours(23, 59, 59, 999)
      return apiFetch<TeacherScheduleItemDto[]>(
        `/api/teacher/schedules?from=${from.toISOString()}&to=${to.toISOString()}`,
      )
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  })
}
