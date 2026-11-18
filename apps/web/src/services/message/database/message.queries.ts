//apps\web\src\services\message\database\message.queries.ts
import { CACHE } from '@/cache/server/key'
import { Prisma } from '@/generated/prisma/browser'
import { prisma } from '@/lib/prisma'
import { cacheLife, cacheTag } from 'next/cache'

export const messageSelect = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  channelId: true,
  parentId: true, // on traitera le message parent apres 
  user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
} as const satisfies Prisma.MessageSelect

// Les 50 plus RÉCENTS, rendus du plus ancien au plus récent.
export async function getMessages(channelId: string, orgId: string, limit = 50) {
  'use cache'
  cacheTag(CACHE.MESSAGE(orgId, channelId))
  cacheLife('seconds')
  const rows = await prisma.message.findMany({
    where: { channelId, deletedAt: null, channel: { orgId } },
    select: messageSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
  })
  return rows.reverse()
}


// Lectures de vérification avant écriture : volontairement SANS "use cache".
// Un cache périmé ferait rater un doublon ou valider un parent disparu.


// Exception assumée au scoping orgId : on cherche justement si un id est DÉJÀ
// pris, où que ce soit (la PK est globale). Le résultat n'est jamais exposé tel
// quel : policy R1/R2 le compare au canal et à l'auteur déjà validés.
export const getMessageById = (messageId: string) =>
  prisma.message.findUnique({ where: { id: messageId }, select: messageSelect })