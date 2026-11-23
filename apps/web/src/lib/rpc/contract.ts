// src/lib/rpc/contract.ts
// apps/web/src/lib/rpc/contract.ts
import type { ACTIONS } from './actions'
import type {
  CreateScheduleInput,
  UpdateScheduleDataInput,
} from '@/services/schedule/validation'
import type {
  GetSchedulesDto,
  GetTeacherDailyScheduleDto,
  GetTeacherNextScheduleDto,
} from '@/services/schedule/types'
import type { GetScheduleAttendancesDto } from '@/services/attendance/types'
import type { GetClassesDto } from '@/services/class/types'
import type { GetMessagesDto } from '@/services/message/types'
import type {
  CreateMessageInput,
  UpdateMessageDataInput,
} from '@/services/message/validation'
import type {
  NotificationItem,
  GetNotificationsForUserDto,
  GetUnreadNotificationsForUserDto,
  GetUnreadCountForUserDto,
} from '@/services/notification/types'
import type { resourceTypeSchema, notificationEventSchema } from '@/services/notification/validation'
import type { UserStatus } from '@attendancy/user'
import type { PublicUserInfo, PublicOrganization } from '@/types/user'
import type * as v from 'valibot'

export type ResourceType = v.InferOutput<typeof resourceTypeSchema>
export type NotificationEvent = v.InferOutput<typeof notificationEventSchema>

export type {
  UserStatus,
  PublicUserInfo,
  PublicOrganization,
  CreateScheduleInput,
  UpdateScheduleDataInput,
  GetSchedulesDto,
  GetTeacherDailyScheduleDto,
  GetTeacherNextScheduleDto,
  GetScheduleAttendancesDto,
  GetClassesDto,
  GetMessagesDto,
  CreateMessageInput,
  UpdateMessageDataInput,
  NotificationItem,
  GetNotificationsForUserDto,
  GetUnreadNotificationsForUserDto,
  GetUnreadCountForUserDto,
}

type Actions = typeof ACTIONS

export type ApiClient = {
  [K in keyof Actions]: (
    ...args: Parameters<Actions[K]>
  ) => Promise<Awaited<ReturnType<Actions[K]>>>
}

export type ApiAction = keyof ApiClient
export type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0]
export type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>

export type StartSessionInput = ApiInput<'startSessionAction'>