//src/services/ue-course/types.ts
export * from './generated.types' //generated types
import type { Prisma } from '@/generated/prisma/client'

export type CreateUECourseData = Pick<
    Prisma.UECourseUncheckedCreateInput,
    'name' | 'code' | 'description' | 'credits' | 'duration' | 'ueId' | 'settings' | 'order'
>
export type UpdateUECourseData = Partial<CreateUECourseData>



import { GetUECoursesByUEDto } from './generated.types'
export type UECourseItem = GetUECoursesByUEDto[number]



