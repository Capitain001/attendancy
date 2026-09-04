// src/services/student/validation.ts
import { object, optional, pipe, string, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const enrollStudentSchema = object({
  studentId: pipe(string(), uuid('ID étudiant invalide')),
  classId:   pipe(string(), uuid('ID classe invalide')),
})

export type EnrollStudentInput  = InferInput<typeof enrollStudentSchema>
export type EnrollStudentOutput = InferOutput<typeof enrollStudentSchema>

export const assignStudentGroupSchema = object({
  enrollmentId: pipe(string(), uuid('ID inscription invalide')),
  groupId:      pipe(string(), uuid('ID groupe invalide')),
})

export type AssignStudentGroupInput  = InferInput<typeof assignStudentGroupSchema>
export type AssignStudentGroupOutput = InferOutput<typeof assignStudentGroupSchema>

export const getDirectionStudentsSchema = optional(pipe(string(), uuid('ID classe invalide')))
export type GetDirectionStudentsInput = InferInput<typeof getDirectionStudentsSchema>

