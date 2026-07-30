'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getSubscription, getPlans } from '../database'

export async function getSubscriptionAction() {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getSubscription(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getPlansAction() {
  try {
    return { data: await getPlans() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
