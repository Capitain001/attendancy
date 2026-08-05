// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts weekly-template
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getWeeklyTemplates, getWeeklyTemplate } from './database'

export type GetWeeklyTemplatesDto = Awaited<ReturnType<typeof getWeeklyTemplates>>
export type GetWeeklyTemplateDto = Awaited<ReturnType<typeof getWeeklyTemplate>>
