// src/services/department/validation.ts
import { object, optional, pipe, string, trim, minLength, maxLength, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateDepartmentData, UpdateDepartmentData } from './types'

export const createDepartmentSchema = object({
  name: pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
} satisfies Record<keyof CreateDepartmentData, unknown>)

export const updateDepartmentDataSchema = object({
  name: optional(pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100))),
} satisfies Record<keyof UpdateDepartmentData, unknown>)

export const updateDepartmentSchema = validateWithId('departmentId', updateDepartmentDataSchema)

export type CreateDepartmentInput  = InferInput<typeof createDepartmentSchema>
export type CreateDepartmentOutput = InferOutput<typeof createDepartmentSchema>

export type UpdateDepartmentDataInput = InferInput<typeof updateDepartmentDataSchema>
export type UpdateDepartmentDataOutput = InferOutput<typeof updateDepartmentDataSchema>

export type UpdateDepartmentInput  = InferInput<typeof updateDepartmentSchema>
export type UpdateDepartmentOutput = InferOutput<typeof updateDepartmentSchema>
