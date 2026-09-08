"use client"
import { useState, useTransition } from "react"
import { checkExistingMainFunctionsAction } from "@/services/function"

export function useCheckMainFunctions() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = () => {
    setError(null)
    startTransition(async () => {
      const res = await checkExistingMainFunctionsAction()
      if ("error" in res && res.error) {
        setError(res.error)
        return
      }
      setResult(res.data ?? null)
    })
  }

  return { check, result, error, isPending }
}