// src/services/device/types.ts
export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'

export type CreateSessionData = Pick<
  Prisma.UserSessionUncheckedCreateInput,
  'userId' | 'deviceId' | 'orgId' | 'ipAddress' | 'userAgent' | 'authSessionId'
>