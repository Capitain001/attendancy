"use client"

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getFunctionsAction, getFunctionProfilesAction } from '@/services/function/actions'
import { CACHE_KEYS } from '@/config/client_cache'

export default function useManageFunctions() {
  const [activeIndex, setActiveIndex] = useState(0)

  const {
    data: functions,
    isLoading: isFunctionsLoading,
    error,
    refetch
  } = useQuery({
    queryKey: CACHE_KEYS.FUNCTIONS.MAIN_WITH_USERS,
    queryFn: async () => {
      const result = await getFunctionsAction()
      if ('error' in result) throw new Error(result.error)
      return (result.data ?? []).filter(f => f.isMain)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const activeFn = functions?.[activeIndex]

  const {
    data: activeProfiles,
    isLoading: isProfilesLoading,
  } = useQuery({
    queryKey: ['function-profiles', activeFn?.id],
    queryFn: async () => {
      if (!activeFn) return []
      const result = await getFunctionProfilesAction(activeFn.id)
      if ('error' in result) throw new Error(result.error)
      return result.data ?? []
    },
    enabled: !!activeFn,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const activeFunction = activeFn
    ? { ...activeFn, profiles: activeProfiles ?? [] }
    : undefined

  const setActive = (index: number) => {
    if (functions && index >= 0 && index < functions.length) {
      setActiveIndex(index)
    }
  }

  const resetActiveIndex = () => setActiveIndex(0)

  return {
    functions: functions ?? [],
    activeFunction,
    activeIndex,
    isLoading: isFunctionsLoading || isProfilesLoading,
    error,
    setActive,
    resetActiveIndex,
    refetch,
  }
}
