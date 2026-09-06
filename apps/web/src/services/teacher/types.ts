import type { UpdateTeacherDepartmentInput } from './validation'

import { GetTeacherCoursesDto, GetTeacherDto, GetTeachersDto } from './generated.types'

export type { UpdateTeacherDepartmentInput }

export type TeacherItem                = GetTeachersDto[number]
export type TeacherDTo                 = TeacherItem
export type TeacherCoursesItem = GetTeacherCoursesDto[number]


export type GetTeacherNotNull       = NonNullable<GetTeacherDto>
export * from './generated.types'



