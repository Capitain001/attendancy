import type { getUserProfile, getUsersByRoles, getFunctionProfiles } from '../database'

export type UserProfile      = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>
export type UserProfileList  = Awaited<ReturnType<typeof getUsersByRoles>>
export type FunctionProfile  = Awaited<ReturnType<typeof getFunctionProfiles>>[number]
