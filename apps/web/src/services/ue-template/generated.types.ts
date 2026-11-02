// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts ue-template
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { applyProgramTemplate, getReferentials, getReferential, getReferentialWithPrograms, getProgramTemplates, getOrgProgramTemplates } from './database'

export type ApplyProgramTemplateDto = Awaited<ReturnType<typeof applyProgramTemplate>>
export type GetReferentialsDto = Awaited<ReturnType<typeof getReferentials>>
export type GetReferentialDto = Awaited<ReturnType<typeof getReferential>>
export type GetReferentialWithProgramsDto = Awaited<ReturnType<typeof getReferentialWithPrograms>>
export type GetProgramTemplatesDto = Awaited<ReturnType<typeof getProgramTemplates>>
export type GetOrgProgramTemplatesDto = Awaited<ReturnType<typeof getOrgProgramTemplates>>
