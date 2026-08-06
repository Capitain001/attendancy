// src/services/course-teacher/validation.ts
import { object, optional, pipe, string, uuid, boolean, number, integer, minValue, array } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const assignTeacherSchema = object({
  courseId:  pipe(string(), uuid('ID cours invalide')),
  teacherId: pipe(string(), uuid('ID enseignant invalide')),
  isMain:    optional(boolean()),
  hours:     optional(pipe(number(), integer(), minValue(1))),
})

export type AssignTeacherInput  = InferInput<typeof assignTeacherSchema>
export type AssignTeacherOutput = InferOutput<typeof assignTeacherSchema>

export const syncCourseTeachersSchema = object({
  courseId:     pipe(string(), uuid('ID cours invalide')),
  // '' = aucun principal (désaffectation) — sinon un UUID enseignant.
  principalId:  string(),
  assistantIds: array(pipe(string(), uuid('ID enseignant invalide'))),
})

export type SyncCourseTeachersInput  = InferInput<typeof syncCourseTeachersSchema>
export type SyncCourseTeachersOutput = InferOutput<typeof syncCourseTeachersSchema>
