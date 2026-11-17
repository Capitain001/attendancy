// src/services/message/types.ts
// generated.types.ts : auto-généré (npx tsx scripts/generate/types/types.ts message)
export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'

export type CreateMessageData = Pick< Prisma.MessageUncheckedCreateInput,'id' | 'content' | 'channelId' | 'parentId' | 'createdAt'>


export type UpdateMessageData = Pick<Prisma.MessageUncheckedUpdateInput, 'content'>
