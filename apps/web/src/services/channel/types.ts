export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'

export type CreateChannelData = Pick<
  Prisma.ChannelUncheckedCreateInput,
  'type' | 'name' | 'isPrivate' | 'classId' | 'groupId'
>

// type / classId / groupId sont immuables : seul l'affichage et la visibilité changent.
export type UpdateChannelData = Pick<Prisma.ChannelUncheckedUpdateInput, 'name' | 'isPrivate'>
