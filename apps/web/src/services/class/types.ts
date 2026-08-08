import type { CreateClassInput } from './validation'
import type { getClasses, getClass } from './database'
import { GetClassesDto } from './generated.types'

export type { CreateClassInput }

export type ClassItem     = GetClassesDto[number]
export * from './generated.types'
