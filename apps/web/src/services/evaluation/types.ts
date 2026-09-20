// src/services/evaluation/types.ts
export * from "./generated.types";

import type { Prisma } from "@/generated/prisma/client";

export type CreateEvaluationData = Pick<
  Prisma.EvaluationUncheckedCreateInput,
  "courseId" | "type" | "title" | "coefficient" | "maxScore" | "datedAt"
>;

export type UpdateEvaluationData = Partial<
  Pick<
    Prisma.EvaluationUncheckedCreateInput,
    "type" | "title" | "coefficient" | "maxScore" | "datedAt"
  >
>;
