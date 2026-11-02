// src/services/personal/types.ts
import { Class, Prisma } from '@/generated/prisma/client'

export type CreatePersonalClassData = Pick<Class, 'name'>
export type UpdatePersonalClassData = Partial<Pick<Prisma.ClassUncheckedCreateInput, 'name' | 'type'>>

export * from './generated.types'
