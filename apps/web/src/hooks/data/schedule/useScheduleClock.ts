'use client'

import { useEffect, useState } from 'react'
import type { DBSchedule } from '@/services/schedule/policy'

/**
 * Retourne `now`, mis à jour uniquement quand un statut UI peut changer.
 *
 * Seuls les Schedule en DB PENDING sont réévalués par resolveScheduleUiStatus,
 * et leurs transitions sont monotones (PENDING → ONGOING → MISSED). Il suffit
 * donc de se réveiller à la prochaine frontière (startTime ou endTime > now).
 * Plus de frontière → plus de timer.
 *
 * Choix assumé : vue de consultation, pas de surveillance. Un léger décalage
 * (ex. timer ralenti sur un onglet en arrière-plan) est acceptable ; la
 * performance prime sur la précision temps réel.
 */
export function useScheduleClock(schedules: DBSchedule[]): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const current = Date.now()

    const boundaries = schedules
      .filter((s) => s.status === 'PENDING')
      .flatMap((s) => [s.startTime.getTime(), s.endTime.getTime()])
      .filter((t) => t > current)

    if (boundaries.length === 0) return

    const delay = Math.min(...boundaries) - current
    const id = setTimeout(() => setNow(new Date()), delay)
    return () => clearTimeout(id)
    // `now` en dépendance : après chaque réveil, on reprogramme la frontière suivante.
    // Si le timer part un peu tôt, la frontière est encore > now : il se reprogramme seul.
  }, [schedules, now])

  return now
}