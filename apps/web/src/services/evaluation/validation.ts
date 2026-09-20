// src/services/evaluation/validation.ts
import * as v from "valibot";
import type { InferInput, InferOutput } from "valibot";
import { validateWithId } from "@/utils/server/validation";
import type { CreateEvaluationData, UpdateEvaluationData } from "./types";
import { EVALUATION_TYPES, GRADE_STATUSES } from "./constants";

export const createEvaluationSchema = v.object({
  courseId: v.pipe(v.string(), v.uuid("ID cours invalide")),
  type: v.picklist(EVALUATION_TYPES),
  title: v.pipe(v.string(), v.trim(), v.minLength(1, "Titre requis"), v.maxLength(150)),
  coefficient: v.optional(v.pipe(v.number(), v.minValue(0.1, "Coefficient positif requis")), 1),
  maxScore: v.optional(v.pipe(v.number(), v.minValue(1, "Barème minimum 1")), 20),
  datedAt: v.date("Date invalide"),
} satisfies Record<keyof CreateEvaluationData, unknown>);

export type CreateEvaluationInput = InferInput<typeof createEvaluationSchema>;
export type CreateEvaluationOutput = InferOutput<typeof createEvaluationSchema>;

export const updateEvaluationDataSchema = v.object({
  type: v.optional(v.picklist(EVALUATION_TYPES)),
  title: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, "Titre requis"), v.maxLength(150))),
  coefficient: v.optional(v.pipe(v.number(), v.minValue(0.1))),
  maxScore: v.optional(v.pipe(v.number(), v.minValue(1))),
  datedAt: v.optional(v.date()),
} satisfies Record<keyof UpdateEvaluationData, unknown>);

export type UpdateEvaluationDataInput = InferInput<typeof updateEvaluationDataSchema>;
export type UpdateEvaluationDataOutput = InferOutput<typeof updateEvaluationDataSchema>;

export const updateEvaluationSchema = validateWithId("evaluationId", updateEvaluationDataSchema);

export type UpdateEvaluationInput = InferInput<typeof updateEvaluationSchema>;
export type UpdateEvaluationOutput = InferOutput<typeof updateEvaluationSchema>;

export const gradeEntrySchema = v.object({
  enrollmentId: v.pipe(v.string(), v.uuid("ID inscription invalide")),
  status: v.picklist(GRADE_STATUSES),
  score: v.optional(v.nullish(v.number())),
  comment: v.optional(v.nullish(v.string())),
});

export type GradeEntryInput = InferInput<typeof gradeEntrySchema>;
export type GradeEntryOutput = InferOutput<typeof gradeEntrySchema>;

export const upsertGradesDataSchema = v.object({
  grades: v.array(gradeEntrySchema),
});

export const upsertGradesSchema = validateWithId("evaluationId", upsertGradesDataSchema);

export type UpsertGradesInput = InferInput<typeof upsertGradesSchema>;
export type UpsertGradesOutput = InferOutput<typeof upsertGradesSchema>;
