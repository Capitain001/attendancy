// apps/web/src/services/message/actions/message.queries.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'

import { ERRORS, ERROR_CODES } from '@/config'
import {
  getMessagesSchema,
  getOlderMessagesSchema,
  type GetMessagesInput,
  type GetOlderMessagesInput,
} from '../validation'
import { getMessages, getOlderMessages } from '../database'
import { MESSAGE } from '../policy'
import { isChannelMember } from '@/services/channel-member/server'

export async function getMessagesAction(input: GetMessagesInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(getMessagesSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  const { channelId } = parsed.output

  try {
    if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) return MESSAGE.ERRORS.NOT_MEMBER
    return { data: await getMessages(channelId, orgId) }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}

/**
 * Page de messages antérieurs au curseur `before` (le plus ancien message déjà chargé).
 * La taille de page est fixée côté serveur : le client ne la choisit pas.
 */
export async function getOlderMessagesAction(input: GetOlderMessagesInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(getOlderMessagesSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  const { channelId, before } = parsed.output

  try {
    if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) return MESSAGE.ERRORS.NOT_MEMBER
    return { data: await getOlderMessages(channelId, orgId, before) }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}