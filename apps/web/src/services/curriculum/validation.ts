
// src/services/curriculum/validation.ts
import * as v from 'valibot'
import { object, string, pipe, trim, minLength, maxLength } from "valibot";
import type { InferInput } from "valibot";

// TODO: remplacer par les vrais champs du modèle Curriculum
export const createCurriculumSchema = object({
  name: pipe(string(), trim(), minLength(1, "Nom requis"), maxLength(100)),
});

export type CreateCurriculumInput = InferInput<typeof createCurriculumSchema>;


export const classIdSchema = v.pipe(v.string(), v.uuid('ID de classe invalide'))
