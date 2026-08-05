// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts teacher-unavailability
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getTeacherUnavailabilities } from './database'

export type GetTeacherUnavailabilitiesDto = Awaited<ReturnType<typeof getTeacherUnavailabilities>>
