import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api-client'
import type { DayScheduleDto } from '@attendancy/types'

export function usePlanning(classId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['planning', classId, from, to],
    queryFn:  () =>
      apiFetch<DayScheduleDto[]>(`/api/planning?classId=${classId}&from=${from}&to=${to}`),
    staleTime: 5 * 60 * 1000,    // 5 min
    gcTime:    7 * 24 * 60 * 60 * 1000, // 7 jours (offline)
  })
}
