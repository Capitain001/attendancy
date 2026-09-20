// src/services/evaluation/database/evaluation.mutations.ts
import { prisma } from "@/lib/prisma";
import { tryConstraint } from "@/utils/server/prisma";
import { invalidateEvent } from "@/cache/server/graph";
import type {
  CreateEvaluationOutput,
  UpdateEvaluationDataOutput,
  GradeEntryOutput,
} from "../validation";

export async function createEvaluation(data: CreateEvaluationOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.evaluation.create({
      data,
      select: { id: true, courseId: true, title: true },
    }),
  );
  await invalidateEvent("EVALUATION_CREATED", data.orgId);
  return result;
}

export async function updateEvaluation(
  evaluationId: string,
  orgId: string,
  data: UpdateEvaluationDataOutput,
) {
  const result = await tryConstraint(
    prisma.evaluation.update({
      where: { id: evaluationId, orgId },
      data,
      select: { id: true, courseId: true, title: true },
    }),
  );
  await invalidateEvent("EVALUATION_UPDATED", orgId, evaluationId);
  return result;
}

export async function deleteEvaluation(evaluationId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.evaluation.delete({
      where: { id: evaluationId, orgId },
      select: { id: true, courseId: true },
    }),
  );
  await invalidateEvent("EVALUATION_DELETED", orgId, evaluationId);
  return result;
}

export async function upsertGrades(
  evaluationId: string,
  orgId: string,
  grades: GradeEntryOutput[],
) {
  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, orgId },
    select: { id: true },
  });
  if (!evaluation) {
    throw new Error("Évaluation introuvable");
  }

  const result = await prisma.$transaction(
    grades.map((g) =>
      prisma.grade.upsert({
        where: {
          evaluationId_enrollmentId: {
            evaluationId,
            enrollmentId: g.enrollmentId,
          },
        },
        create: {
          evaluationId,
          enrollmentId: g.enrollmentId,
          status: g.status,
          score: g.score,
          comment: g.comment,
        },
        update: {
          status: g.status,
          score: g.score,
          comment: g.comment,
        },
        select: { id: true, enrollmentId: true, status: true, score: true },
      }),
    ),
  );

  await invalidateEvent("EVALUATION_UPDATED", orgId, evaluationId);
  return result;
}
