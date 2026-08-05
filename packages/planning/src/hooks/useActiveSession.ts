import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api-client'
import type { ActiveSessionDto } from '@attendancy/types'

export function useActiveSession() {
  return useQuery({
    queryKey: ['session', 'active'],
    queryFn:  () => apiFetch<ActiveSessionDto | null>('/api/session/active'),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
