// src/services/chat/database/message.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { AppError } from '@/utils/server/error'
import { invalidateEvent } from '@/cache/server/graph'
import { ERRORS, ERROR_CODES } from '@/config'
import type { CreateMessageOutput, UpdateMessageDataOutput } from '../validation'
import { findOwn, messageSelect, toMessageDto } from './message.queries'
import { checkParent, isTrustedCreatedAt, MESSAGE } from '../policy'

// Enregistre un message de façon idempotente.
//
// Pourquoi : un client (en ligne ou hors ligne) renvoie ses messages jusqu'à
// confirmation. Rejouer le même id (même auteur, même canal) ne crée donc pas de
// doublon : la base ignore l'insert (ON CONFLICT DO NOTHING) et on répond succès
// avec created: false. Le contenu et la date du rejeu sont ignorés : la ligne
// d'origine fait foi.
//
// Le client connaît déjà son message et son auteur : on renvoie l'id, created
// et createdAt (pour aligner le cache et la diffusion temps réel sur l'heure retenue).
//
//   { id, created: true, createdAt }  -> nouvelle insertion, cache invalidé
//   { id, created: false, createdAt } -> déjà existant, date d'origine retournée
//
// L'id est fourni par le client (obligatoire, validé en amont).
// userId et orgId viennent de la session, jamais de l'entrée client.
//
// createMany est utilisé uniquement parce que c'est le seul create* de Prisma
// qui supporte skipDuplicates.
//
// Cache : invalidé seulement si une ligne a réellement été insérée. Un rejeu
// ne change rien au contenu du canal.
export async function createMessage({
  orgId,
  ...data
}: CreateMessageOutput & { userId: string; orgId: string }) {
  const now = new Date()
  // R3 : la date du client n'est retenue que si elle est plausible, sinon heure du serveur
  const createdAt = data.createdAt && isTrustedCreatedAt(data.createdAt, now) ? data.createdAt : now

  if (data.parentId) {
    const parent = await prisma.message.findUnique({
      where: { id: data.parentId },
      select: { channelId: true, deletedAt: true },
    })
    const refusal = checkParent(parent, data.channelId)
    if (refusal) {
      // Un rejeu légitime passe d'abord (ack perdu, parent supprimé entre-temps)
      const own = await findOwn(data)
      if (own) return { id: data.id, created: false, createdAt: own.createdAt }
      const e = MESSAGE.ERRORS[refusal]
      throw new AppError({ message: e.error, code: e.code })
    }
  }

  const { count } = await tryConstraint(
    prisma.message.createMany({ data: [{ ...data, createdAt }], skipDuplicates: true }),
  )
  if (count > 0) {
    await invalidateEvent('MESSAGE_CREATED', orgId, data.channelId)
    return { id: data.id, created: true, createdAt }
  }

  // Rejeu : la ligne d'origine fait foi, date comprise
  const own = await findOwn(data)
  if (!own) throw new AppError({ message: ERRORS.UNIQUE.ID, code: ERROR_CODES.CONFLICT })
  return { id: data.id, created: false, createdAt: own.createdAt }
}

// Seul l'auteur peut modifier son message 
export async function updateMessage(messageId: string, userId: string, data: UpdateMessageDataOutput) {
  const row = await tryConstraint(
    prisma.message.update({
      // deletedAt: null : un message supprimé n'est plus modifiable
      where: { id: messageId, userId, deletedAt: null },
      data: {
        content: data.content,
        // Posé uniquement ici : c'est la version de référence des éditions
        ...(data.content !== undefined && { editedAt: new Date() }),
      },
      select: messageSelect,
    })
  )
  return toMessageDto(row)
}

// Soft delete
// Seul l'auteur peut le supprimer.
export async function removeMessage(messageId: string, userId: string) {
  return prisma.message.update({
    where: { id: messageId, userId },
    data: { deletedAt: new Date() },
    select: { id: true },
  })
}
