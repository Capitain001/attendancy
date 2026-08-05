// src/services/teacher/validation.ts
import { object, optional, pipe, string, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const updateTeacherDepartmentSchema = object({
  teacherId:    pipe(string(), uuid('ID enseignant invalide')),
  departmentId: optional(pipe(string(), uuid('ID département invalide'))),
})

export type UpdateTeacherDepartmentInput  = InferInput<typeof updateTeacherDepartmentSchema>
export type UpdateTeacherDepartmentOutput = InferOutput<typeof updateTeacherDepartmentSchema>

export type CreateTeacherInput = { userId: string; departmentId?: string }
export type UpdateTeacherInput = UpdateTeacherDepartmentInput
