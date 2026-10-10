
// Factory pure réutilisable côté serveur (prefetch) ET client (hook).
import { getSchedulesAction, getScheduleDaysAction, getTeacherSchedulesAction, getTeacherDailyScheduleAction } from '@/services/schedule/actions'
import type { GetScheduleDaysInput, GetSchedulesDto } from '@/services/schedule'

import { CACHE_KEYS, QUERY_PRESETS } from '@/cache/client/key'

import { GetTeacherDailyScheduleOutput } from './validation'


export interface GetTeacherDailyScheduleParams {
  teacherId?: string;
  /** Format ISO : yyyy-MM-dd */
  dayKey?: string;
}

//tache recente :a auditer
/**
 * Charge les séances d'un enseignant pour une date donnée (`dayKey`).
 * Clé cache : `CACHE_KEYS.SCHEDULES.BY_TEACHER.BY_DAY` (`["schedules", "by-teacher", teacherId, dayKey]`)
 * Preset : `QUERY_PRESETS.SESSION`
 */


export function teacherDailyScheduleQuery(params: GetTeacherDailyScheduleParams = {}) {
  const { teacherId, dayKey } = params
  return {
    queryKey: CACHE_KEYS.SCHEDULES.BY_TEACHER.BY_DAY({ teacherId, dayKey }),
    queryFn: async () => {
      const res = await getTeacherDailyScheduleAction(dayKey ? { dayKey } : undefined)
      if ('error' in res && res.error) throw new Error(res.error)
      return res.data ?? []
    },
    ...QUERY_PRESETS.SESSION,
  }
}