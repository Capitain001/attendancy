import type { CreateGroupInput } from './validation'
import type { getGroupsByClass } from './database'

export type { CreateGroupInput }

export type GetGroupsDto = Awaited<ReturnType<typeof getGroupsByClass>>
export type GroupItem    = GetGroupsDto[number]
