import type { getFunctions, getFunctionByName,getFunctionProfiles } from './database'

export type FunctionItem      = Awaited<ReturnType<typeof getFunctions>>[number]
export type FunctionDetail    = Awaited<ReturnType<typeof getFunctionByName>>

export type GetFunctionProfilesDto = Awaited< ReturnType<typeof getFunctionProfiles>>;
export type GetFunctionProfilesItem = GetFunctionProfilesDto[number];