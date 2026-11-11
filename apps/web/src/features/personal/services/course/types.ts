// src/features/personal/services/course/types.ts
export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'
import { GetPersonalCoursesDto } from './generated.types'

// classId + name viennent du modèle Course ; teacherId (CourseTeacher) et
// withGroup (décision de l'appelant) sont des paramètres de flux, pas des champs Course.
export type CreatePersonalCourseData = Pick<Prisma.CourseUncheckedCreateInput, 'classId' | 'name'> & {
  teacherId: string
  withGroup?: boolean
}


export type PersonalCourseItem = GetPersonalCoursesDto[number];