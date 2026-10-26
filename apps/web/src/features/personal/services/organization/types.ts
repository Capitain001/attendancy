import type { PersonalRole } from '@/modules/auth/constants'

export type CreatePersonalOrgParams = {
  userId: string
  role: PersonalRole
  userName?: string | null
}

export type CreatePersonalProfileParams = {
  userId: string
  orgId: string
  role: PersonalRole
}
