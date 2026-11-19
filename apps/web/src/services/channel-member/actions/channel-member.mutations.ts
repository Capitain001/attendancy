// services/channel-member/actions/channel-member.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS, ERROR_CODES } from '@/config'
import { updateChannelMuteByUser } from '../database'
import { updateChannelMuteSchema } from '../validation'
import type { UpdateChannelMuteInput } from '../validation'

export async function updateChannelMuteByUserAction(input: UpdateChannelMuteInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error, code: auth.code }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(updateChannelMuteSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  const { channelId, data } = parsed.output

  try {
    // userId vient de la session : on ne peut couper que son propre canal
    const { count } = await updateChannelMuteByUser({ channelId, userId: user.id, orgId }, data)
    if (count === 0) return { error: 'Accès refusé' }
    return { data: { muted: data.muted } }
  } catch {
    return { error: ERRORS.SERVER, code: ERROR_CODES.SERVER }
  }
}
