import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api-client'
import type { DayScheduleDto } from '@attendancy/types'

// Utilise la route dev (sans auth) uniquement quand on est sur le même
// origine que Next.js (web) ET en développement. Tauri définit VITE_API_URL
// → toujours la route réelle avec Bearer auth.
const planningEndpoint =
  typeof import.meta !== 'undefined' &&
  (import.meta as any).env?.DEV &&
  !(import.meta as any).env?.VITE_API_URL
    ? '/api/planning/dev'
    : '/api/planning'

export function usePlanning(classId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['planning', classId, from, to],
    queryFn:  () =>
      apiFetch<DayScheduleDto[]>(`${planningEndpoint}?classId=${classId}&from=${from}&to=${to}`),
    staleTime: 5 * 60 * 1000,    // 5 min
    gcTime:    7 * 24 * 60 * 60 * 1000, // 7 jours (offline)
  })
}
