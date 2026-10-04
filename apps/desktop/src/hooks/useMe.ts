import { useQuery } from '@tanstack/react-query'
import type { ApiOutput } from '@attendancy/types'
import { api } from '../lib/api'

type CurrentUser = Extract<ApiOutput<'getCurrentUserAction'>, { data: unknown }>['data']

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<CurrentUser> => {
      const result = await api.getCurrentUserAction()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
