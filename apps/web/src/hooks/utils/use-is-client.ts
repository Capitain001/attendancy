// src/hooks/utils/use-is-client.ts
"use client"
import { useEffect, useState } from "react"
export function useIsClient() {
  const [isClient, setClient] = useState(false)
  useEffect(() => {
    setClient(true)
  }, [])
  return isClient
}
