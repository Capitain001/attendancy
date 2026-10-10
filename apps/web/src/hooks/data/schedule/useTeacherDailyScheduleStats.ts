// apps/web/src/hooks/data/schedule/useTeacherDailyScheduleStats.ts
'use client'

import { useMemo } from 'react'
import { resolveScheduleUiStatus, type DBSchedule } from '@/services/schedule/policy'
import { useScheduleClock } from './useScheduleClock'

/**
 * Compteurs d'une journée de planning.
 *
 * Invariant : `total === completed + remaining + missed`
 * (les séances annulées sont exclues de `total`, exposées dans `canceled`).
 */
export type TeacherDailyScheduleCount = {
  /** Séances maintenues : toutes sauf les annulées. Un total de 0 ne signifie pas « aucune séance en base » (voir `canceled`). */
  total: number
  /** Séances actées COMPLETED en DB. */
  completed: number
  /** Séances ONGOING + PENDING (non terminées, en cours incluse). */
  remaining: number
  /** Séances MISSED : actées en DB, ou PENDING dont `endTime` est passé (latence d'écriture). */
  missed: number
  /** Séances CANCELED. Hors `total`. */
  canceled: number
}

/**
 * Statistiques d'une journée de planning d'un enseignant.
 *
 * Toutes les règles reposent sur `resolveScheduleUiStatus` (statut DB + horloge),
 * donc elles sont cohérentes avec les badges affichés sur les cartes.
 * Aucune règle temporelle n'est dupliquée ici.
 *
 * - `ongoing`  : première séance au statut UI ONGOING
 *                (DB PENDING et `startTime <= now < endTime`), sinon `null`.
 *                Dérivé du temps, jamais persisté.
 * - `upcoming` : première séance au statut UI PENDING (pas encore commencée),
 *                sinon `null`. Les annulées et manquées sont ignorées.
 * - `count`    : voir {@link TeacherDailyScheduleCount}.
 *
 * Attend des `schedules` triés par `startTime` (garanti par `useTeacherDailySchedule`) :
 * `ongoing` et `upcoming` prennent la première occurrence rencontrée.
 *
 * Le générique `T` conserve le type complet de la séance (`class`, `room`, ...)
 * sur `ongoing` et `upcoming`.
 *
 * Réactivité : `useScheduleClock` réveille le hook aux frontières `startTime` / `endTime`
 * des séances DB PENDING, seules à dépendre du temps. Les statuts actés
 * (COMPLETED, CANCELED, MISSED) priment toujours sur le calcul temporel.
 *
 * @example
 * const { schedules } = useTeacherDailySchedule({ teacherId })
 * const { ongoing, upcoming, count } = useTeacherDailyScheduleStats(schedules)
 *
 * // Distinguer « journée libre » de « tout annulé » :
 * const allCanceled = count.total === 0 && count.canceled > 0
 */
export function useTeacherDailyScheduleStats<T extends DBSchedule>(schedules: T[]) {
  const now = useScheduleClock(schedules)

  return useMemo(() => {
    let ongoing: T | null = null
    let upcoming: T | null = null
    let completed = 0
    let remaining = 0
    let missed = 0
    let canceled = 0

    for (const s of schedules) {
      switch (resolveScheduleUiStatus(s, now)) {
        case 'ONGOING':
          ongoing ??= s
          remaining++
          break
        case 'PENDING':
          upcoming ??= s // premier PENDING dans l'ordre chronologique
          remaining++
          break
        case 'COMPLETED':
          completed++
          break
        case 'MISSED':
          missed++
          break
        case 'CANCELED':
          canceled++
          break
      }
    }

    const count: TeacherDailyScheduleCount = {
      total: schedules.length - canceled,
      completed,
      remaining,
      missed,
      canceled,
    }

    return { ongoing, upcoming, count }
  }, [schedules, now])
}