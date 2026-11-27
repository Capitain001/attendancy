// packages/ui/src/components/chat/useDelayedFlag.ts
'use client'

import { useEffect, useState } from 'react'

// Vrai seulement si `flag` dure au moins `ms` : évite d'annoncer un état transitoire
// (« Hors ligne » pendant la connexion initiale, « connexion impossible » après une seconde).
export function useDelayedFlag(flag: boolean, ms: number) {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    if (!flag) return
    const timer = setTimeout(() => setElapsed(true), ms)
    return () => {
      clearTimeout(timer)
      setElapsed(false)
    }
  }, [flag, ms])
  return flag && elapsed
}

