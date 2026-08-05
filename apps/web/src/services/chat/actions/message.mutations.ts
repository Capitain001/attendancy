'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createMessage, updateMessage, removeMessage } from '../database'
import type { AddMessageData, UpdateMessageData } from '../database'

export async function sendMessageAction(input: Omit<AddMessageData, 'userId'>) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await createMessage({ ...input, userId: user.id }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateMessageAction(messageId: string, data: UpdateMessageData) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await updateMessage(messageId, user.id, data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeMessageAction(messageId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await removeMessage(messageId, user.id) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
