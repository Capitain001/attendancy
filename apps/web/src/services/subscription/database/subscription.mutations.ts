import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { SubscriptionStatus } from '@/prisma'

export type CreateSubscriptionData = {
  orgId: string
  planId: string
}

export async function createSubscription({ orgId, planId }: CreateSubscriptionData) {
  const result = await tryConstraint(
    prisma.subscription.create({
      data: { orgId, planId },
      select: { id: true },
    })
  )
  await invalidateEvent('SUBSCRIPTION_CREATED', orgId)
  return result
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  orgId: string,
  status: SubscriptionStatus
) {
  const result = await tryConstraint(
    prisma.subscription.update({
      where: { id: subscriptionId, orgId },
      data: { status },
      select: { id: true, status: true },
    })
  )
  await invalidateEvent('SUBSCRIPTION_UPDATED', orgId)
  return result
}
