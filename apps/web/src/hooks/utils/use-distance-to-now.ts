// apps/web/src/hooks/utils/use-distance-to-now.ts
'use client'

import { useEffect, useReducer } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { DATE_LOCALE } from '@/lib/date'

/**
 * Temps restant jusqu'à `target` ("12 minutes"), rafraîchi à chaque changement de minute.
 * Même principe que useScheduleClock : un timeout jusqu'à la prochaine frontière, jamais de polling.
 * `null` en entrée → `null` en sortie (permet un appel inconditionnel).
 */
export function useDistanceToNow(target: Date | null): string | null {
  const [tick, bump] = useReducer((n: number) => n + 1, 0)
  const targetMs = target?.getTime() ?? null

  useEffect(() => {
    if (targetMs === null) return
    const ms = targetMs - Date.now()
    if (ms <= 0) return
    const id = setTimeout(bump, ms % 60_000 || 60_000)
    return () => clearTimeout(id)
    // `tick` en dépendance : après chaque réveil, on reprogramme la frontière suivante.
  }, [targetMs, tick])

  return target
    ? formatDistanceToNowStrict(target, {
        locale: DATE_LOCALE,
        roundingMethod: 'floor', // 1 h 40 → « 1 heure », jamais « 2 heures »
      })
    : null
}