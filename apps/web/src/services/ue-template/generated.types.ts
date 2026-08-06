// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts ue-template
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getReferentials, getUETemplates, getUETemplate, getUETemplateImport, getUETemplateImportsByOrg } from './database'

export type GetReferentialsDto = Awaited<ReturnType<typeof getReferentials>>
export type GetUETemplatesDto = Awaited<ReturnType<typeof getUETemplates>>
export type GetUETemplateDto = Awaited<ReturnType<typeof getUETemplate>>
export type GetUETemplateImportDto = Awaited<ReturnType<typeof getUETemplateImport>>
export type GetUETemplateImportsByOrgDto = Awaited<ReturnType<typeof getUETemplateImportsByOrg>>
