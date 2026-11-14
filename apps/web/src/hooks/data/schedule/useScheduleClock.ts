// src/hooks/data/schedule/useScheduleClock.ts
'use client'

import { useEffect, useState } from 'react'
import type { DBSchedule } from '@/services/schedule/policy'

/**
 * Retourne `now`, mis à jour uniquement quand un statut UI peut changer.
 *
 * Seuls les Schedule en DB PENDING sont réévalués par resolveScheduleUiStatus,
 * et leurs transitions sont monotones (PENDING → ONGOING → MISSED). Il suffit
 * donc de se réveiller à la prochaine frontière :
 *   - startTime - lead (l'appelant veut être réveillé avant le début)
 *   - startTime
 *   - endTime
 * Plus de frontière → plus de timer.
 *
 * `lead` : avance de réveil avant `startTime` (en ms), décidée par l'appelant.
 * Le hook ne connaît aucune règle métier. 0 (défaut) = aucune frontière en plus.
 *
 * Choix assumé : vue de consultation, pas de surveillance. Un léger décalage
 * (ex. timer ralenti sur un onglet en arrière-plan) est acceptable ; la
 * performance prime sur la précision temps réel.
 */
export function useScheduleClock(schedules: DBSchedule[], lead = 0): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const current = Date.now()

    const boundaries = schedules
      // Seules les séances PENDING dépendent du temps (les autres statuts sont actés)
      .filter((s) => s.status === 'PENDING')
      // Si lead = 0, `start - lead` double `start` : sans effet sur Math.min
      .flatMap((s) => [s.startTime.getTime() - lead, s.startTime.getTime(), s.endTime.getTime()])
      // Uniquement les frontières à venir
      .filter((t) => t > current)

    if (boundaries.length === 0) return

    // Un seul timer, sur la prochaine frontière
    const delay = Math.min(...boundaries) - current
    const id = setTimeout(() => setNow(new Date()), delay)
    return () => clearTimeout(id)
    // `now` en dépendance : après chaque réveil, on reprogramme la frontière suivante.
    // Si le timer part un peu tôt, la frontière est encore > now : il se reprogramme seul.
    // `lead` en dépendance : s'il change, les frontières sont recalculées.
  }, [schedules, lead, now])

  return now
}