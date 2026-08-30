import type { UpdateTeacherDepartmentInput } from './validation'

import { GetTeachersDto } from './generated.types'

export type { UpdateTeacherDepartmentInput }

export type TeacherItem                = GetTeachersDto[number]
export type TeacherDTo                 = TeacherItem

export * from './generated.types'



