"use client"

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getMainFunctionsWithUsersAction } from '@/services/fonctions'
import { CACHE_KEYS } from '@/config/client_cache'


export default function useManageFunctions() {
  const [activeIndex, setActiveIndex] = useState(0)

  // Récupération des fonctions principales avec leurs utilisateurs
  const {
    data: functions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: CACHE_KEYS.FUNCTIONS.MAIN_WITH_USERS,
    queryFn: async () => {
      const result = await getMainFunctionsWithUsersAction()
      if ('error' in result) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fonction pour obtenir la fonction active
  const activeFunction = functions && functions.length > 0 
    ? functions[activeIndex] 
    : undefined

  // Fonction pour changer la fonction active
  const setActive = (index: number) => {
    if (functions && index >= 0 && index < functions.length) {
      setActiveIndex(index)
    }
  }

  // Réinitialiser l'index actif si les données changent
  const resetActiveIndex = () => {
    setActiveIndex(0)
  }

  return {
    functions: functions || [],
    activeFunction,
    activeIndex,
    isLoading,
    error,
    setActive,
    resetActiveIndex,
    refetch,
  }
}
