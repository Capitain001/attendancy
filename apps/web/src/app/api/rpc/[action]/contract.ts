// apps/web/src/app/api/rpc/contract.ts
import type { Jsonify } from 'type-fest'
import type { ACTIONS } from './actions'

type Actions = typeof ACTIONS

export type ApiClient = {
  [K in keyof Actions]: (
    ...args: Parameters<Actions[K]>
  ) => Promise<Jsonify<Awaited<ReturnType<Actions[K]>>>>
}

export type ApiAction = keyof ApiClient
export type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0]
export type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>