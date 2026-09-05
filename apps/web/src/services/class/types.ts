// src/services/class/types.ts

import type { CreateClassInput } from './validation'
import { GetClassesDto } from './generated.types'
import { Class } from '@/generated/prisma/client'
export * from './generated.types'

export type { CreateClassInput }

export type ClassItem     = GetClassesDto[number]
export type GetClassesItem = GetClassesDto[number]

// Source de vérité : le modèle Prisma.
export type CreateClassData = Pick<Class, 'name' | 'programTrackId' | 'level' | 'academicYearId'>
export type UpdateClassData = Partial<CreateClassData>
