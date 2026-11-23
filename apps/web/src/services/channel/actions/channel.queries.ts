'use server'

import * as v from 'valibot'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { getChannel, getChannels } from '../database'
import { channelIdSchema } from '../validation'

export async function getChannelsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getChannels(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getChannelAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsedChannelId = v.safeParse(channelIdSchema, channelId)
  if (!parsedChannelId.success) return { error: parsedChannelId.issues[0]?.message ?? 'ID invalide' }

  try {
    return { data: await getChannel(parsedChannelId.output, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}