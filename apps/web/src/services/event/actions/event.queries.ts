'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getEvents, getEvent } from '../database'

export async function getEventsAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getEvents(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getEventAction(eventId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    const event = await getEvent(eventId, orgId)
    if (!event) return { error: 'Événement introuvable' }
    return { data: event }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
