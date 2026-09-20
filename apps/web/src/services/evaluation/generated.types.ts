// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts evaluation
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createEvaluation, updateEvaluation, deleteEvaluation, upsertGrades, getCourseEvaluations, getEvaluationDetail, getEvaluation } from './database'

export type CreateEvaluationDto = Awaited<ReturnType<typeof createEvaluation>>
export type UpdateEvaluationDto = Awaited<ReturnType<typeof updateEvaluation>>
export type DeleteEvaluationDto = Awaited<ReturnType<typeof deleteEvaluation>>
export type UpsertGradesDto = Awaited<ReturnType<typeof upsertGrades>>
export type GetCourseEvaluationsDto = Awaited<ReturnType<typeof getCourseEvaluations>>
export type GetEvaluationDetailDto = Awaited<ReturnType<typeof getEvaluationDetail>>
export type GetEvaluationDto = Awaited<ReturnType<typeof getEvaluation>>
