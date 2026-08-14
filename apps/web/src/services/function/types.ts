import type { Prisma } from '@/generated/prisma/client'
export * from './generated.types'


import type { getFunctions, getFunctionByName,getFunctionProfiles } from './database'

export type FunctionItem      = Awaited<ReturnType<typeof getFunctions>>[number]
export type FunctionDetail    = Awaited<ReturnType<typeof getFunctionByName>>

export type CreateFunctionData = Pick<Prisma.FunctionUncheckedCreateInput, 'name' | 'description' | 'icon' | 'isMain'>
export type UpdateFunctionData = Partial<CreateFunctionData>
