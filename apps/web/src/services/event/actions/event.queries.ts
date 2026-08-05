'use server'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import { getEvents, getEvent } from '../database'

export async function getEventsAction() {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getEvents(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getEventAction(eventId: string) {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const event = await getEvent(eventId, orgId)
    if (!event) return { error: 'Événement introuvable' }
    return { data: event }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
