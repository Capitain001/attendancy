'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

export type SeedActionResponse<T> = {
  data?: T
  error?: string
}

export function useSeedAction<TOptions, TResult>(
  actionFn: (orgId: string, options?: TOptions) => Promise<{ data?: TResult; error?: string }>
) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const execute = (orgId: string, options?: TOptions) => {
    const trimmedOrgId = orgId?.trim()
    if (!trimmedOrgId) {
      const msg = "L'ID de l'organisation est requis."
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const res = await actionFn(trimmedOrgId, options)
        if (res.error) {
          setError(res.error)
          toast.error(res.error)
        } else if (res.data !== undefined) {
          setResult(res.data)
          setError(null)
          toast.success('Opération de seed effectuée avec succès.')
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Erreur imprévue lors du seeding.'
        setError(errMsg)
        toast.error(errMsg)
      }
    })
  }

  const reset = () => {
    setResult(null)
    setError(null)
  }

  return {
    execute,
    isPending,
    result,
    error,
    reset,
  }
}
