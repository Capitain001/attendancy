import type { CreateUECourseInput } from './validation'
import type { getUECoursesByUE, UpdateUECourseData } from './database'

export type { CreateUECourseInput }
export type { UpdateUECourseData }

export type GetUECoursesDto = Awaited<ReturnType<typeof getUECoursesByUE>>
export type UECourseItem    = GetUECoursesDto[number]
