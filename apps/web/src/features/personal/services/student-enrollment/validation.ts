import * as v from "valibot";

export const enrollStudentsInPersonalCourseSchema = v.object({
  courseId: v.pipe(v.string(), v.uuid("ID de cours invalide")),
  studentIds: v.pipe(
    v.array(v.pipe(v.string(), v.uuid("ID étudiant invalide"))),
    v.minLength(1, "Sélectionnez au moins un étudiant"),
  ),
});

export type EnrollStudentsInPersonalCourseInput = v.InferInput<
  typeof enrollStudentsInPersonalCourseSchema
>;
export type EnrollStudentsInPersonalCourseOutput = v.InferOutput<
  typeof enrollStudentsInPersonalCourseSchema
>;
