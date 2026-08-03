'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createSubscriptionSchema } from '../validation'
import { createSubscription, updateSubscriptionStatus } from '../database'
import type { SubscriptionStatus } from '@/generated/prisma'

export async function createSubscriptionAction(input: unknown) {
  try {
    const auth = await authAccess({ requiredRole: ['ADMIN', 'DIRECTION'], requiredFunction: 'PRINCIPAL' })
    
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.parse(createSubscriptionSchema, input)
    const subscription = await createSubscription({ orgId, planId: parsed.planId })
    return { data: subscription }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function updateSubscriptionStatusAction(
  subscriptionId: string,
  status: SubscriptionStatus
) {
  try {
    const auth = await authAccess({ requiredRole: ['ADMIN', 'DIRECTION'], requiredFunction: 'PRINCIPAL' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const result = await updateSubscriptionStatus(subscriptionId, orgId, status)
    return { data: result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}