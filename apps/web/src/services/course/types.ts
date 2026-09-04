//src/services/course/types.ts
import type { Prisma } from '@/generated/prisma/client'
import type { CreateCourseInput, LinkCoursesToTermInput } from './validation'
import type {  GetCoursesDto } from './generated.types'

export * from './generated.types'
export type { CreateCourseInput, LinkCoursesToTermInput }

export type CreateCourseData = Pick<Prisma.CourseUncheckedCreateInput, 'ueCourseId' | 'classId' | 'termId' | 'name'>
export type UpdateCourseData = Partial<Pick<Prisma.CourseUncheckedCreateInput, 'name' | 'description'>>

/** Cours d'une classe avec ses enseignants — élément de getCoursesByClass. */
export type GetCoursesItem = GetCoursesDto[number]
export type CourseDTO = GetCoursesItem
