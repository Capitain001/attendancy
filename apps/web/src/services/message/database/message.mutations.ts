// src/services/chat/database/message.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { AppError } from '@/utils/server/error'
import { invalidateEvent } from '@/cache/server/graph'
import { ERRORS, ERROR_CODES } from '@/config'
import type { CreateMessageOutput, UpdateMessageDataOutput } from '../validation'
import { messageSelect } from './message.queries'

// Enregistre un message de façon idempotente.
//
// Pourquoi : un client (en ligne ou hors ligne) renvoie ses messages jusqu'à
// confirmation. Rejouer le même id (même auteur, même canal) ne crée donc pas de
// doublon : la base ignore l'insert (ON CONFLICT DO NOTHING) et on répond succès
// avec created: false. Le contenu et la date du rejeu sont ignorés : la ligne
// d'origine fait foi.
//
// Le client connaît déjà son message et son auteur : on ne renvoie que l'id
// et created, pas de relecture complète ni de jointure user.
//
//   { id, created: true }  -> nouvelle insertion, cache invalidé
//   { id, created: false } -> déjà existant, no-op côté serveur
//
// L'id est fourni par le client (obligatoire, validé en amont).
// userId et orgId viennent de la session, jamais de l'entrée client.
//
// createMany est utilisé uniquement parce que c'est le seul create* de Prisma
// qui supporte skipDuplicates.
//
// Cache : invalidé seulement si une ligne a réellement été insérée. Un rejeu
// ne change rien au contenu du canal.
//
// Sécurité : count === 0 peut venir d'un rejeu légitime ou d'un id déjà pris
// par un autre auteur ou un autre canal. Le count filtré sur
// (id, userId, channelId) les distingue : 0 -> CONFLICT, sinon rejeu.
// La policy isReplay reste une défense en profondeur.
export async function createMessage({
  orgId,
  ...data
}: CreateMessageOutput & { userId: string; orgId: string }) {
  const { count } = await tryConstraint(
    prisma.message.createMany({ data: [data], skipDuplicates: true }),
  )
  if (count > 0) {
    await invalidateEvent('MESSAGE_CREATED', orgId, data.channelId)
    return { id: data.id, created: true }
  }

  const ownedCount = await prisma.message.count({
    where: { id: data.id, userId: data.userId, channelId: data.channelId },
  })
  if (ownedCount === 0) {
    throw new AppError({ message: ERRORS.UNIQUE.ID, code: ERROR_CODES.CONFLICT })
  }

  return { id: data.id, created: false }
}

// Seul l'auteur peut modifier son message 
export async function updateMessage(messageId: string, userId: string, data: UpdateMessageDataOutput) {
  return tryConstraint(prisma.message.update({
    // deletedAt: null : un message supprimé n'est plus modifiable
    where: { id: messageId, userId, deletedAt: null },
    data: {
      content: data.content,
      // Posé uniquement ici : c'est la version de référence des éditions
      ...(data.content !== undefined && { editedAt: new Date() }),
    },
    select: messageSelect,
  }))
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