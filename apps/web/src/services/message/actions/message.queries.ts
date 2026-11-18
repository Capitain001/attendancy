//apps\web\src\services\message\actions\message.queries.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'

import { ERRORS, ERROR_CODES } from '@/config'
import { getMessagesSchema, type GetMessagesInput } from '../validation'
import { getMessages } from '../database'
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