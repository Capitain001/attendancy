'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS, ERROR_CODES } from '@/config'
import { buildError } from '@/utils/server/error'
import { createMessageSchema, updateMessageSchema } from '../validation'
import type { CreateMessageInput, UpdateMessageInput } from '../validation'
import { createMessage, removeMessage, updateMessage } from '../database'

// Envoi d'un message. Idempotent : le client fournit l'id, un rejeu renvoie
// { id, created: false } sans rien écrire. L'identité (user, org) vient de la
// session, jamais de l'entrée.
export async function createMessageAction(input: CreateMessageInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  const parsed = v.safeParse(createMessageSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? ERRORS.BAD_REQUEST, code: ERROR_CODES.VALIDATION }
  }

  try {
    const message = await createMessage({
      ...parsed.output,
      userId: user.id,
      orgId,
    })
    return { data: message }
  } catch (e) {
    return buildError(e)
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
