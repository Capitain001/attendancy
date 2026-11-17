//apps\web\src\services\message\database\message.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'

import { isChannelMember } from '@/services/channel-member/server'
import { checkParent, isReplay, isTrustedCreatedAt } from '../policy'
import type { CreateMessageOutput } from '../validation'

import { messageSelect , getMessageById} from './message.queries'
import { invalidateEvent } from '@/cache/server/graph'

type SendMessageParams = CreateMessageOutput & { orgId: string; userId: string }

// Écriture seule : aucune vérification. createdAt absent → Prisma applique now().
export async function createMessage({ orgId, id, createdAt, ...data }: SendMessageParams) {
  const message = await tryConstraint(
    prisma.message.create({
      data: { ...data, ...(id && { id }), ...(createdAt && { createdAt }) },
      select: messageSelect,
    }),
  )
  await invalidateEvent('MESSAGE_CREATED', orgId, data.channelId)
  return message
}

// Orchestration : vérifie dans l'ordre, puis écrit une seule fois.
export async function sendMessage(params: SendMessageParams) {
  const { orgId, id, userId, channelId, parentId, createdAt: declared } = params

  if (!(await isChannelMember({ channelId, userId, orgId }))) {
    return { refusal: 'NOT_MEMBER' as const }
  }

  if (parentId) {
    const refusal = checkParent(await getMessageById(parentId), channelId)
    if (refusal) return { refusal }
  }

  if (id) {
    const existing = await getMessageById(id)
    if (existing) {
      return isReplay(existing, params) ? { message: existing } : { refusal: 'ID_TAKEN' as const }
    }
  }

  const createdAt = declared && isTrustedCreatedAt(declared, new Date()) ? declared : undefined

  try {
    return { message: await createMessage({ ...params, createdAt }) }
  } catch (error) {
    // Course : un envoi simultané du même id a gagné.
    const raced = id ? await getMessageById(id) : null
    if (raced && isReplay(raced, params)) return { message: raced }
    throw error
  }
}