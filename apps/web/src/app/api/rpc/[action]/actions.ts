// apps/web/src/app/api/rpc/actions.ts
import { getSchedulesAction } from '@/services/schedule'
import { getClassesAction } from '@/services/class'

export const ACTIONS = { getSchedulesAction, getClassesAction } as const