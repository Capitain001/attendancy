import type { getFunctions, getFunctionByName } from './database'

export type FunctionItem      = Awaited<ReturnType<typeof getFunctions>>[number]
export type FunctionDetail    = Awaited<ReturnType<typeof getFunctionByName>>
