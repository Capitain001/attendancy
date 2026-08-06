import type { CreateGroupInput, UpdateGroupInput, SetGroupStudentsInput } from './validation'
import type { GetGroupsByClassDto, GetGroupEligibleStudentsDto } from './generated.types'

export type { CreateGroupInput, UpdateGroupInput, SetGroupStudentsInput }

export type GroupItem            = GetGroupsByClassDto[number]
export type EligibleStudentItem  = GetGroupEligibleStudentsDto[number]
export * from './generated.types'
