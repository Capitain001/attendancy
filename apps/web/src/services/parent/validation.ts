import * as v from "valibot";

const requiredId = (message: string) => v.pipe(v.string(), v.nonEmpty(message));

export const childScopeSchema = v.object({
  childId: requiredId("Enfant requis"),
});

export type ChildScopeInput = v.InferInput<typeof childScopeSchema>;

/* =========================
   DIRECTION — assignation parent (P-18 A)
========================= */

export const createParentRelationSchema = v.object({
  studentId: requiredId("Étudiant requis"),
  parentId: requiredId("Parent requis"),
  relation: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Lien requis"),
    v.maxLength(60, "Lien trop long"),
  ),
});

export const deleteParentRelationSchema = v.object({
  relationId: requiredId("Relation requise"),
  studentId: requiredId("Étudiant requis"),
});

export const searchParentsSchema = v.object({
  query: v.pipe(v.string(), v.trim()),
  excludeStudentId: v.optional(v.string()),
});
