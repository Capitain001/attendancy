"use client"
import { useRouter, useSearchParams } from "next/navigation"

export interface FilterOption {
  id: string
  name: string
  [key: string]: any // pour les propriétés supplémentaires
}

// hooks/useFilterLogic.ts
export function useFilterLogic() {
    const router = useRouter()
    const searchParams = useSearchParams()
  
    const updateParam = (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push("?" + params.toString())
    }
  
    const resetFilters = () => {
      router.push("?")
    }
  
    const getCurrentValue = (key: string) => {
      return searchParams.get(key) || ""
    }
  
    const hasActiveFilters = (keys: readonly string[]) => {
      return keys.some(key => searchParams.get(key))
    }
  
    const countActiveFilters = (keys: readonly string[]) => {
      return keys.filter(key => searchParams.get(key)).length
    }
  
    return {
      updateParam,
      resetFilters,
      getCurrentValue,
      hasActiveFilters,
      countActiveFilters
    }
  }
