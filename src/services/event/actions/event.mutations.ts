'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/modules/user'
import { getAuthorization } from '@/modules/auth'
import { ERRORS } from '@/config'
import { createEventSchema, updateEventSchema } from '../validation'
import type { CreateEventInput, UpdateEventInput } from '../validation'
import { createEvent, updateEvent, removeEventDb } from '../database'

export async function createEventAction(input: CreateEventInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(createEventSchema, input)
    return { data: await createEvent(orgId, user.id, parsed) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateEventAction(eventId: string, input: UpdateEventInput) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const parsed = v.parse(updateEventSchema, input)
    return { data: await updateEvent(eventId, orgId, parsed) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeEventAction(eventId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    await removeEventDb(eventId, orgId)
    return { data: { id: eventId } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
