// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts weekly-template
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createWeeklyTemplate, updateWeeklyTemplate, removeWeeklyTemplate, createWeeklySlot, removeWeeklySlot, applyWeeklyTemplate, getWeeklyTemplates, getWeeklyTemplate } from './database'

export type CreateWeeklyTemplateDto = Awaited<ReturnType<typeof createWeeklyTemplate>>
export type UpdateWeeklyTemplateDto = Awaited<ReturnType<typeof updateWeeklyTemplate>>
export type RemoveWeeklyTemplateDto = Awaited<ReturnType<typeof removeWeeklyTemplate>>
export type CreateWeeklySlotDto = Awaited<ReturnType<typeof createWeeklySlot>>
export type RemoveWeeklySlotDto = Awaited<ReturnType<typeof removeWeeklySlot>>
export type ApplyWeeklyTemplateDto = Awaited<ReturnType<typeof applyWeeklyTemplate>>
export type GetWeeklyTemplatesDto = Awaited<ReturnType<typeof getWeeklyTemplates>>
export type GetWeeklyTemplateDto = Awaited<ReturnType<typeof getWeeklyTemplate>>
