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
import type {
  NotificationItem,
  GetNotificationsForUserDto,
  GetUnreadNotificationsForUserDto,
  GetUnreadCountForUserDto,
} from '@/services/notification/types'
import type { notificationTypeSchema } from '@/services/notification/validation'
import type { UserInfo, UserStatus, PublicUserInfo, PublicOrganization } from '@/types/user'
import type * as v from 'valibot'

export type NotificationType = v.InferOutput<typeof notificationTypeSchema>

export type {
  UserInfo,
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