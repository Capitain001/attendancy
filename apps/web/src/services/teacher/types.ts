import type { UpdateTeacherDepartmentInput } from './validation'

import { GetTeacherDto, GetTeachersDto } from './generated.types'

export type { UpdateTeacherDepartmentInput }

export type GetTeacherItem = GetTeachersDto[number]

export type GetTeacherNotNull       = NonNullable<GetTeacherDto>
export * from './generated.types'



