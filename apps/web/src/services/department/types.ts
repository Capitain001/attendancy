import type { Prisma } from '@/generated/prisma/client'
import type { CreateDepartmentInput, UpdateDepartmentInput } from './validation'

import { GetDepartmentsDto } from './generated.types'

export type { CreateDepartmentInput, UpdateDepartmentInput }

export type CreateDepartmentData = Pick<Prisma.DepartmentUncheckedCreateInput, 'name'>
export type UpdateDepartmentData = Partial<CreateDepartmentData>

export type GetDepartmentsItem    = GetDepartmentsDto[number]
export type DepartmentDto     = GetDepartmentsItem
export * from './generated.types'
