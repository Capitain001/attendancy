import type { getDirectionMembers, getDirectionMember } from './database'

export type DirectionMemberDetail  = Awaited<ReturnType<typeof getDirectionMember>>

export interface AssignFunctionsParams {
  userId:        string
  functionNames: string[]
}
export * from './generated.types'
