'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getSubscription, getPlans } from '../database'

export async function getSubscriptionAction() {
  try {
    const auth = await authAccess({ 
      requiredRole: ['ADMIN', 'DIRECTION'], 
      requiredFunction: 'PRINCIPAL' 
    })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

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
