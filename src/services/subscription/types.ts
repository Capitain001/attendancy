import type { getSubscription, getPlans } from './database'

export type GetSubscriptionDto = Awaited<ReturnType<typeof getSubscription>>
export type GetPlansDto = Awaited<ReturnType<typeof getPlans>>
export type PlanDto = GetPlansDto[number]
