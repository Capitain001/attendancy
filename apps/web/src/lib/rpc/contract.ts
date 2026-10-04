// apps/web/src/lib/rpc/contract.ts
import type { ACTIONS } from './actions'
import type {
  CreateScheduleInput,
  UpdateScheduleDataInput,
} from '@/services/schedule/validation'

export type { CreateScheduleInput, UpdateScheduleDataInput }

type Actions = typeof ACTIONS

export type ApiClient = {
  [K in keyof Actions]: (
    ...args: Parameters<Actions[K]>
  ) => Promise<Awaited<ReturnType<Actions[K]>>>
}

export type ApiAction = keyof ApiClient
export type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0]
export type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>