import type { UserInfo } from './types'

export function generateUserInfo(
  user: UserInfo,
  fields: (keyof UserInfo)[],
  overrides?: Partial<UserInfo>,
): Partial<UserInfo> {
  const result: Partial<UserInfo> = {}
  for (const field of fields) {
    if (field in user) {
      (result as Record<string, unknown>)[field] = user[field as keyof UserInfo]
    }
  }
  return { ...result, ...overrides }
}
