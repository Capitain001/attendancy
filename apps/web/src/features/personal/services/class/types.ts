import type { Prisma } from '@/generated/prisma/client'

export type CreatePersonalClassData = Pick<Prisma.ClassUncheckedCreateInput, 'name' | 'type'>
export type UpdatePersonalClassData = Partial<CreatePersonalClassData>
export * from './generated.types'
