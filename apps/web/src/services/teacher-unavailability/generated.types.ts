// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts teacher-unavailability
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createWeeklyUnavailability, createDateRangeUnavailability, deleteTeacherUnavailability, getTeacherUnavailabilities } from './database'

export type CreateWeeklyUnavailabilityDto = Awaited<ReturnType<typeof createWeeklyUnavailability>>
export type CreateDateRangeUnavailabilityDto = Awaited<ReturnType<typeof createDateRangeUnavailability>>
export type DeleteTeacherUnavailabilityDto = Awaited<ReturnType<typeof deleteTeacherUnavailability>>
export type GetTeacherUnavailabilitiesDto = Awaited<ReturnType<typeof getTeacherUnavailabilities>>
