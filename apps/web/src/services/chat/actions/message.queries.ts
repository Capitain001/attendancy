'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getMessages, getRoomParticipants } from '../database'

export async function getMessagesAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getMessages(channelId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getRoomParticipantsAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getRoomParticipants(channelId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
