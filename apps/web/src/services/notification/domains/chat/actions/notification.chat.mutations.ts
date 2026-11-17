'use server'
import * as v from 'valibot'
import { ERRORS } from '@/config'
import { getUserInfo } from '@/modules/user'
import { isChannelMember } from '@/services/channel-member/server'

import { sendParticipantNotificationsSchema } from '../validation'
import type { SendParticipantNotificationsInput } from '../validation'
import { sendParticipantNotifications } from '../database'

/**
 * Notifie les membres d'un canal d'un nouveau message (en ligne ou non).
 * L'expéditeur et son organisation viennent de la session, jamais du client, et
 * l'expéditeur doit être membre du canal : la liste des destinataires ne dépend donc
 * que du canal. `excludedIds` ne peut que réduire cette liste, jamais l'élargir.
 */
export async function sendParticipantNotificationsAction(input: SendParticipantNotificationsInput) {
  const sender = await getUserInfo()
  const orgId = sender?.organization?.id
  if (!sender?.id || !orgId) return { error: 'Non authentifié' }

  const parsed = v.safeParse(sendParticipantNotificationsSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    // Un utilisateur étranger au canal (ou à son organisation) ne peut pas y notifier
    if (!(await isChannelMember({ channelId: parsed.output.channelId, userId: sender.id, orgId }))) {
      return { error: 'Accès refusé' }
    }

    await sendParticipantNotifications({ ...parsed.output, senderId: sender.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}