import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getPlans() {
  'use cache'
  cacheTag(CACHE.PLAN())
  cacheLife(CACHE.PLAN.life)
  return prisma.plan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      priceMonthly: true,
      currency: true,
      features: true,
    },
    orderBy: { priceMonthly: 'asc' },
  })
}

export async function getSubscription(orgId: string) {
  'use cache'
  cacheTag(CACHE.SUBSCRIPTION(orgId))
  cacheLife(CACHE.SUBSCRIPTION.life)
  return prisma.subscription.findUnique({
    where: { orgId },
    select: {
      id: true,
      status: true,
      trialEndsAt: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      canceledAt: true,
      plan: {
        select: {
          id: true,
          code: true,
          name: true,
          priceMonthly: true,
          currency: true,
          features: true,
        },
      },
    },
  })
}
