'use server'
import { getUserInfo } from '@/modules/user/userInfo'
import { ERRORS } from '@/config'
import { createMessage, updateMessage, removeMessage } from '../database'
import type { AddMessageData, UpdateMessageData } from '../database'

export async function sendMessageAction(input: Omit<AddMessageData, 'userId'>) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: await createMessage({ ...input, userId: user.id }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateMessageAction(messageId: string, data: UpdateMessageData) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: await updateMessage(messageId, user.id, data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeMessageAction(messageId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    return { data: await removeMessage(messageId, user.id) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
