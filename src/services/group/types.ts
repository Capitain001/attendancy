import type { CreateGroupInput } from './validation'
import type { getGroupsByClass } from './database'

export type { CreateGroupInput }

export type GroupItem    = GetGroupsDto[number]
export * from './generated.types'
