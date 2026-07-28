export type { UserInfo } from '@/services/user/types'

export interface PresenceUser {
  id: string
  name?: string
  email?: string
  avatar?: string
  [key: string]: unknown
}
