// services/notification/domains/chat/actions/notification.chat.mutations.ts
'use server'
import * as v from 'valibot'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { isChannelMember } from '@/services/channel-member/server'
import { getMessageForNotification } from '@/services/message/server'

import { notifyChannelMembersSchema } from '../validation'
import type { NotifyChannelMembersInput } from '../validation'
import { notifyChannelMembers } from '../operations'

/**
 * Notifie les membres d'un canal d'un nouveau message (en ligne ou non).
 * L'expéditeur et son organisation viennent de la session, jamais du client, et
 * le contenu vient de la base : un push ne peut annoncer qu'un message réel,
 * écrit par l'expéditeur, dans ce canal, et non supprimé.
 * `excludedIds` ne peut que réduire la liste des destinataires, jamais l'élargir.
 */
export async function notifyChannelMembersAction(input: NotifyChannelMembersInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(notifyChannelMembersSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  const { channelId, messageId, excludedIds } = parsed.output

  try {
    // Un utilisateur étranger au canal (ou à son organisation) ne peut pas y notifier
    if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) {
      return { error: 'Accès refusé' }
    }

    // La requête ne renvoie pas un message supprimé : introuvable = refusé
    const message = await getMessageForNotification(messageId)
    if (!message || message.channelId !== channelId || message.userId !== user.id) {
      return { error: 'Accès refusé' }
    }

    // Un parent supprimé (ou sans auteur) ne donne pas lieu à un texte dédié
    const parent = message.parent
    const parentUserId = parent && !parent.deletedAt ? parent.userId : null

    await notifyChannelMembers({
      orgId,
      channelId,
      messageId,
      content: message.content,
      senderId: user.id,
      senderName: user.name,
      parentUserId,
      excludedIds,
    })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}