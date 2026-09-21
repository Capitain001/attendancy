// ⚠ AJOUTS à fusionner dans src/services/attendance/constants.ts
// (créer le fichier s'il n'existe pas encore).
// Les règles de taux et le seuil d'absentéisme restent dans policy.ts.

// ─── Vue d'ensemble enseignant ───────────────────────────────────────────────

export const TEACHER_OVERVIEW_PERIODS = ['30d', '90d', 'all'] as const
export type TeacherOverviewPeriod = (typeof TEACHER_OVERVIEW_PERIODS)[number]

export const DEFAULT_TEACHER_OVERVIEW_PERIOD: TeacherOverviewPeriod = '90d'

export const TEACHER_OVERVIEW_PERIOD_LABELS: Record<TeacherOverviewPeriod, string> = {
  '30d': '30 jours',
  '90d': '90 jours',
  all: 'Tout',
}

// undefined = pas de borne basse
export const TEACHER_OVERVIEW_PERIOD_DAYS: Record<TeacherOverviewPeriod, number | undefined> = {
  '30d': 30,
  '90d': 90,
  all: undefined,
}

export const ABSENTEEISM_LIST_LIMIT = 5
export const RECENT_SESSIONS_LIMIT = 6
