import type { CreateClassInput } from './validation'
import type { getClasses, getClass } from './database'

export type { CreateClassInput }

export type GetClassesDto = Awaited<ReturnType<typeof getClasses>>
export type ClassItem     = GetClassesDto[number]
export type GetClassDto   = Awaited<ReturnType<typeof getClass>>
