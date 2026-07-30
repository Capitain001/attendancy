'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { createSubscriptionSchema } from '../validation'
import { createSubscription, updateSubscriptionStatus } from '../database'
import type { SubscriptionStatus } from '@/generated/prisma'

export async function createSubscriptionAction(input: unknown) {
  try {
    const user = await getUserInfo()
    if (!user?.id) throw new Error(ERRORS.AUTH.UNAUTHORIZED)
    const orgId = user.organization?.id
    if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND)
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
    const user = await getUserInfo()
    if (!user?.id) throw new Error(ERRORS.AUTH.UNAUTHORIZED)
    const orgId = user.organization?.id
    if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND)
    const result = await updateSubscriptionStatus(subscriptionId, orgId, status)
    return { data: result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}
