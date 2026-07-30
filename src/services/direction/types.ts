import type { getDirectionMembers, getDirectionMember } from './database'

export type DirectionMemberDto     = Awaited<ReturnType<typeof getDirectionMembers>>[number]
export type DirectionMemberDetail  = Awaited<ReturnType<typeof getDirectionMember>>

export interface AssignFunctionsParams {
  userId:        string
  functionNames: string[]
}
