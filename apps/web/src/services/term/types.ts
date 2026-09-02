export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'

// classId requis à la création (rattachement structurant, jamais modifié
// ensuite — absent du payload d'update).
export type CreateTermData = Pick<
  Prisma.TermUncheckedCreateInput,
  'classId' | 'order' | 'name' | 'startDate' | 'endDate'
>

export type UpdateTermData = Partial<Omit<CreateTermData, 'classId'>>
