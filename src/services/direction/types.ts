import type { UserFunction } from '@/generated/prisma/client'

export interface DirectionMemberDto {
  id: string
  userId: string
  orgId: string
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    avatar_url: string | null
  }
  functions: Array<{
    id: string
    name: string
    description: string | null
    icon: string | null
    isMain: boolean
  }>
}

export interface AssignFunctionsParams {
  userId: string
  functionIds: string[]
}
