import type { Function } from '@/generated/prisma/client'
import type { getMainFunctionsUser } from './database'
import type { AddFunctionData, UpdateFunctionData } from './database'

export type { Function, AddFunctionData, UpdateFunctionData }

export type MainFunctionsWithUsers = Awaited<ReturnType<typeof getMainFunctionsUser>>
export type MainFunctionWithUsers = MainFunctionsWithUsers[number]
