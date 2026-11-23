'use server'

import * as v from 'valibot'
import { ERRORS } from '@/config'
import { authAccess } from '@/services/auth'
import { createChannel, removeChannel, updateChannel } from '../database'
import {
  channelIdSchema,
  createChannelSchema,
  updateChannelSchema,
} from '../validation'
import type {
  CreateChannelInput,
  UpdateChannelInput,
} from '../validation'

// Aucun requiredRole / requiredFunction : tout utilisateur authentifié de l'org
// peut créer, renommer ou supprimer un channel (décision produit).

export async function createChannelAction(input: CreateChannelInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createChannelSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const channel = await createChannel({ ...parsed.output, orgId })
    return { data: channel }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateChannelAction(input: UpdateChannelInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updateChannelSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const channel = await updateChannel(parsed.output.channelId, orgId, parsed.output.data)
    return { data: channel }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeChannelAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(channelIdSchema, channelId)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'ID invalide' }

  try {
    const channel = await removeChannel(parsed.output, orgId)
    return { data: channel }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}