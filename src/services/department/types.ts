import type { CreateDepartmentInput, UpdateDepartmentInput } from './validation'
import type { getDepartments } from './database'

export type { CreateDepartmentInput, UpdateDepartmentInput }

export type GetDepartmentsDto = Awaited<ReturnType<typeof getDepartments>>
export type DepartmentItem    = GetDepartmentsDto[number]
export type DepartmentDto     = DepartmentItem
