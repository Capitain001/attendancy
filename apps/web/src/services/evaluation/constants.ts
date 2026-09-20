// src/services/evaluation/constants.ts
import { EvaluationType, GradeStatus } from "@/generated/prisma/browser";

export const EVALUATION_TYPES = Object.values(EvaluationType);
export const GRADE_STATUSES = Object.values(GradeStatus);

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  [EvaluationType.DEVOIR]: "Devoir",
  [EvaluationType.EXAMEN]: "Examen",
  [EvaluationType.PARTICIPATION]: "Participation",
  [EvaluationType.PROJET]: "Projet",
};

export const GRADE_STATUS_LABELS: Record<GradeStatus, string> = {
  [GradeStatus.GRADED]: "Noté",
  [GradeStatus.ABSENT]: "Absent",
  [GradeStatus.EXCUSED]: "Dispensé",
  [GradeStatus.PENDING]: "En attente",
};
