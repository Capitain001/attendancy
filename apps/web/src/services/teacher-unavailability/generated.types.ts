// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts teacher-unavailability
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createTeacherUnavailability, updateTeacherUnavailability, deleteTeacherUnavailability, getTeacherUnavailabilities } from './database'

export type CreateTeacherUnavailabilityDto = Awaited<ReturnType<typeof createTeacherUnavailability>>
export type UpdateTeacherUnavailabilityDto = Awaited<ReturnType<typeof updateTeacherUnavailability>>
export type DeleteTeacherUnavailabilityDto = Awaited<ReturnType<typeof deleteTeacherUnavailability>>
export type GetTeacherUnavailabilitiesDto = Awaited<ReturnType<typeof getTeacherUnavailabilities>>
