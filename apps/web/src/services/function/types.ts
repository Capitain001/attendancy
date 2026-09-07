import type { Prisma } from '@/generated/prisma/client'
import { GetFunctionByNameDto, GetFunctionsDto } from './generated.types'
export * from './generated.types'


export type FunctionItem      = GetFunctionsDto[number]
export type FunctionDetail    = GetFunctionByNameDto

export type CreateFunctionData = Pick<Prisma.FunctionUncheckedCreateInput, 'name' | 'description' | 'icon' | 'isMain'>
export type UpdateFunctionData = Partial<CreateFunctionData>
