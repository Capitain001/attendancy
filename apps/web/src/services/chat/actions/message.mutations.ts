//src/services/chat/actions/message.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createMessage, updateMessage, removeMessage } from '../database'
import { createMessageSchema, updateMessageSchema } from '../validation'
import type { CreateMessageInput, UpdateMessageInput } from '../validation'

export async function sendMessageAction(input: CreateMessageInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const parsed = v.safeParse(createMessageSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await createMessage({ ...parsed.output, userId: user.id }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateMessageAction(input: UpdateMessageInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const parsed = v.safeParse(updateMessageSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    return { data: await updateMessage(parsed.output.messageId, user.id, parsed.output.data) }
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
