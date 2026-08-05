import { getActiveSessions, getOrgDaySchedulesWithSession } from './database'

export type ActiveSessionItem  = Awaited<ReturnType<typeof getActiveSessions>>[number]
export type OrgDaySessionRow   = Awaited<ReturnType<typeof getOrgDaySchedulesWithSession>>[number]

export * from './generated.types'
