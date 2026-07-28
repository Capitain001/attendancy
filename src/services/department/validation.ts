// src/services/department/validation.ts
import { object, pipe, string, trim, minLength, maxLength, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createDepartmentSchema = object({
  name: pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
})

export type CreateDepartmentInput  = InferInput<typeof createDepartmentSchema>
export type CreateDepartmentOutput = InferOutput<typeof createDepartmentSchema>

export const updateDepartmentSchema = object({
  departmentId: pipe(string(), uuid('ID invalide')),
  name:         pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
})

export type UpdateDepartmentInput  = InferInput<typeof updateDepartmentSchema>
export type UpdateDepartmentOutput = InferOutput<typeof updateDepartmentSchema>
