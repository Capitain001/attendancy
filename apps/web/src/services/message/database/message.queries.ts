// apps/web/src/services/message/database/message.queries.ts
import { CACHE } from '@/cache/server/key'
import { Prisma } from '@/generated/prisma/browser'
import { prisma } from '@/lib/prisma'
import { cacheLife, cacheTag } from 'next/cache'
import { MESSAGES_PAGE_SIZE } from '../constants'
import { truncatePreview } from '../preview'

export const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  editedAt: true,
  updatedAt: true,
  channelId: true,
  parentId: true,
  user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
  parent: {
    select: {
      id: true,
      content: true,
      deletedAt: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const satisfies Prisma.MessageSelect

export type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>

// Le contenu d'un parent supprimé ne sort jamais du serveur ; le reste est tronqué.
export function toMessageDto({ parent, ...message }: MessageRow) {
  return {
    ...message,
    parent: parent
      ? {
          id: parent.id,
          deleted: parent.deletedAt !== null,
          content: parent.deletedAt ? null : truncatePreview(parent.content),
          user: parent.user,
        }
      : null,
  }
}

// Curseur composite : createdAt seul sauterait les messages de même date.
export type MessageCursor = { createdAt: Date; id: string }

// Les plus RÉCENTS, rendus du plus ancien au plus récent.
export async function getMessages(channelId: string, orgId: string, limit = MESSAGES_PAGE_SIZE) {
  'use cache'
  cacheTag(CACHE.MESSAGE(orgId, channelId))
  cacheLife('seconds')
  const rows = await prisma.message.findMany({
    where: { channelId, deletedAt: null, channel: { orgId } },
    select: messageSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
  })
  return rows.reverse().map(toMessageDto)
}

// Page de messages STRICTEMENT antérieurs au curseur, rendus du plus ancien au plus récent.
// Volontairement SANS "use cache" : chaque curseur crée une entrée qui sert rarement deux
// fois, et une page ancienne ne doit pas contenir un message tout juste supprimé.
// Index conseillé : @@index([channelId, createdAt(sort: Desc), id(sort: Desc)])
export async function getOlderMessages(
  channelId: string,
  orgId: string,
  before: MessageCursor,
  limit = MESSAGES_PAGE_SIZE,
) {
  const rows = await prisma.message.findMany({
    where: {
      channelId,
      deletedAt: null,
      channel: { orgId },
      OR: [
        { createdAt: { lt: before.createdAt } },
        { createdAt: before.createdAt, id: { lt: before.id } },
      ],
    },
    select: messageSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // +1 : détecte la page suivante sans count(*)
  })
  return { items: rows.slice(0, limit).reverse().map(toMessageDto), hasMore: rows.length > limit }
}

// Lectures de vérification avant écriture : volontairement SANS "use cache".
// Un cache périmé ferait rater un doublon ou valider un parent disparu.

// Exception assumée au scoping orgId : on cherche justement si un id est DÉJÀ
// pris, où que ce soit (la PK est globale). Le résultat n'est jamais exposé tel
// quel : policy R1/R2 le compare au canal et à l'auteur déjà validés.
export const getMessageById = (messageId: string) =>
  prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, channelId: true, parentId: true, user: { select: { id: true } } },
  })

  
// Lecture de vérification : volontairement sans "use cache" (l'état doit être frais).
// Un message supprimé n'est pas retrouvé : l'appelant le traite comme inexistant.
// Exposée aux autres services via server.ts (export * de database/).
export async function getMessageForNotification(messageId: string) {
  return prisma.message.findUnique({
    where: { id: messageId, deletedAt: null },
    select: {
      content: true,
      channelId: true,
      userId: true,
      parent: { select: { userId: true, deletedAt: true } },
    },
  })
}

export const findOwn = ({ id, userId, channelId }: { id: string; userId: string; channelId: string }) =>
  prisma.message.findFirst({ where: { id, userId, channelId }, select: { createdAt: true } })