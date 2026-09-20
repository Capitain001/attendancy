import { object, string, pipe, trim, minLength, maxLength } from "valibot";
import type { InferInput } from "valibot";

// TODO: remplacer par les vrais champs du modèle TeacherCourseHours
export const createTeacherCourseHoursSchema = object({
  name: pipe(string(), trim(), minLength(1, "Nom requis"), maxLength(100)),
});

export type CreateTeacherCourseHoursInput = InferInput<typeof createTeacherCourseHoursSchema>;
