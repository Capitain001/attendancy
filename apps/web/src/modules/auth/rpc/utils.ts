// src/modules/auth/rpc/utils.ts
import { pickKeys } from '@/lib/map'
import { APP_METADATA_KEYS, USER_METADATA_KEYS } from '@/types/user'
import type { UserInfo } from '@/types/user'

/**
 * Clés de UserInfo exposées au client RPC, et SEULE source du type que le client reçoit.
 * Volontairement complète tant que les besoins côté client ne sont pas arrêtés :
 * pour restreindre, retirer des clés ici, la compilation signale alors chaque usage
 * côté client d'un champ qui n'est plus envoyé.
 * `id` est toujours ajouté par mapUserRpc, inutile de le lister.
 */
export const RPC_USER_KEYS = [
  ...APP_METADATA_KEYS,
  ...USER_METADATA_KEYS,
  'email',
  'email_verified',
  'phone_verified',
  'online_at',
  'updated_at',
] as const satisfies readonly (keyof UserInfo)[]

/** Ce que reçoit le client : UserInfo réduit aux clés de RPC_USER_KEYS, plus `id`. */
export type RpcUser = Pick<UserInfo, (typeof RPC_USER_KEYS)[number] | 'id'>

export function mapUserRpc(user: UserInfo): RpcUser {
  // `id` toujours inclus, même si quelqu'un le retire de la liste
  return pickKeys(user, [...RPC_USER_KEYS, 'id'])
}