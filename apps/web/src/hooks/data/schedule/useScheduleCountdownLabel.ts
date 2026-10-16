// apps/web/src/hooks/data/schedule/useScheduleCountdownLabel.ts
'use client'

import { useDistanceToNow } from '@/hooks/utils/use-distance-to-now'
import { scheduleCountdownMessages as m, type ScheduleCountdown } from '@/lib/data/schedule'

export type CountdownSchedule = {
  startTime: Date
  endTime: Date
  session: { id: string } | null
}

/**
 * Décompte affiché au-dessus de la carte, ou `null` s'il n'y a pas de séance.
 *
 * Lecture par défaut : décompte jusqu'au début de la séance.
 *   - hors fenêtre horaire (`!isOngoing`)       → « Cours suivant dans X »
 *   - fenêtre en cours ET session démarrée      → « En cours · fin dans X » (décompte jusqu'à la fin)
 *
 * Exception : fenêtre en cours SANS session. Le temps seul ne prouve pas que le cours a
 * démarré, donc aucun décompte n'est affiché → « Pas encore démarré » (`time` vaut `null`).
 */
export function useScheduleCountdownLabel(
  schedule: CountdownSchedule | null,
  isOngoing: boolean,
): ScheduleCountdown | null {
  // Échéance suivie : la fin si le cours est en cours, sinon le début
  const time = useDistanceToNow(
    schedule ? (isOngoing ? schedule.endTime : schedule.startTime) : null,
  )

  if (!schedule || !time) return null
  if (!isOngoing) return { message: m.upcoming, time }
  if (!schedule.session) return { message: m.awaiting, time: null }
  return { message: m.running, time }
}