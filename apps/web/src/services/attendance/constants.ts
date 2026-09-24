// ⚠ AJOUTS à fusionner dans src/services/attendance/constants.ts
// (créer le fichier s'il n'existe pas encore).
// Les règles de taux et le seuil d'absentéisme restent dans policy.ts.

// ─── Vue d'ensemble enseignant ───────────────────────────────────────────────

export const TEACHER_OVERVIEW_WINDOW_DAYS = 30;
 
export const ABSENTEEISM_LIST_LIMIT = 3;
 
export const RECENT_SESSIONS_LIMIT = 6


export const TEACHER_OVERVIEW_PERIODS = [30, 90, 'all'] as const
export type TeacherOverviewPeriod = (typeof TEACHER_OVERVIEW_PERIODS)[number]

export const DEFAULT_TEACHER_OVERVIEW_PERIOD: TeacherOverviewPeriod = 30

export const getPeriodLabel = (period: TeacherOverviewPeriod) =>
  period === 'all' ? 'Tout' : `${period} jours`

// undefined = pas de borne basse
export const getPeriodDays = (period: TeacherOverviewPeriod) =>
  period === 'all' ? undefined : period