// services/channel-member/actions/channel-member.queries.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS, ERROR_CODES } from '@/config'
import { getChannelMuteByUser, getChannelMember, isChannelMember } from '../database'
import { getChannelMuteByUserSchema, type GetChannelMuteByUserInput } from '../validation'

export async function getChannelMemberAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) {
    return { error: 'Accès refusé au canal' }
  }

  try {
    return { data: await getChannelMember(channelId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}

export async function getChannelMuteByUserAction(input: GetChannelMuteByUserInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(getChannelMuteByUserSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    // userId vient de la session : on ne lit que sa propre sourdine
    const member = await getChannelMuteByUser({
      channelId: parsed.output.channelId,
      userId: user.id,
      orgId,
    })
    if (!member) return { error: 'Accès refusé' }
    return { data: { muted: member.mutedAt !== null } }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}
