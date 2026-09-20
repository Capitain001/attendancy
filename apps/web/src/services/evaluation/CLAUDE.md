# Service `evaluation`

## Rôle
Gestion des évaluations de cours (`Evaluation`) et de la saisie des notes (`Grade`).

## Modèles Prisma
- `Evaluation` — événement d'évaluation (titre, type, coefficient, barème, date).
- `Grade` — note individuelle rattachée à une inscription (`StudentEnrollment`).
Régime de suppression : **hard delete** (`delete*`). Cascade sur les notes lors de la suppression d'une évaluation.

## Fichiers
- `database/evaluation.queries.ts` — lectures Prisma (`"use cache"`) : `getCourseEvaluations`, `getEvaluationDetail`, `getEvaluation`
- `database/evaluation.mutations.ts` — écritures Prisma (`tryConstraint` + `invalidateEvent`) : `createEvaluation`, `updateEvaluation`, `deleteEvaluation`, `upsertGrades`
- `cache.ts` — graphe d'invalidation (`EVALUATION_GRAPH`)
- `validation.ts` — schémas Valibot (`createEvaluationSchema`, `updateEvaluationSchema`, `upsertGradesSchema`)
- `actions/evaluation.queries.ts` — queries exposées au frontend (`getCourseEvaluationsAction`, `getEvaluationDetailAction`, `getEvaluationAction`)
- `actions/evaluation.mutations.ts` — mutations `"use server"` (`createEvaluationAction`, `updateEvaluationAction`, `deleteEvaluationAction`, `upsertGradesAction`)
- `constants.ts`, `types.ts`, `generated.types.ts` — enums + DTOs inférés

## Contraintes
- Une évaluation appartient obligatoirement à une organisation et à un cours.
- L'unicité `[evaluationId, enrollmentId]` garantit une seule note par inscription par évaluation.

## Commandes

CMD des générateurs pour le service evaluation :
```bash
# index API
npx tsx scripts/generate/api/api.ts evaluation

# types
npx tsx scripts/generate/types/types.ts evaluation

# résumé
npx tsx scripts/generate/summary/summary.ts evaluation
```
