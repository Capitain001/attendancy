// src/services/auth/rpc.ts
import type { UserInfo } from '@/types/user'

/**
 * Clés de UserInfo exposées au client RPC.
 * `undefined` = tout UserInfo : volontairement permissif tant que les besoins
 * côté client ne sont pas arrêtés. Pour restreindre, lister les clés retenues.
 */
export const RPC_USER_KEYS: readonly (keyof UserInfo)[] | undefined = undefined

export function mapUserRpc(user: UserInfo, keys = RPC_USER_KEYS): UserInfo {
  if (!keys) return user
  return Object.fromEntries(keys.map((key) => [key, user[key]])) as UserInfo
}


