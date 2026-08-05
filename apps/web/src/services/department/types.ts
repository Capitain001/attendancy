import type { CreateDepartmentInput, UpdateDepartmentInput } from './validation'
import type { getDepartments } from './database'

export type { CreateDepartmentInput, UpdateDepartmentInput }

export type DepartmentItem    = GetDepartmentsDto[number]
export * from './generated.types'
