export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
}

export interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan: SubscriptionPlan
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export async function getSubscriptionAction(): Promise<{ data: Subscription | null } | { error: string }> {
  return { data: null }
}

export async function createCheckoutSessionAction(
  _planId: string
): Promise<{ data: { url: string } } | { error: string }> {
  return { error: 'Not implemented' }
}

export async function cancelSubscriptionAction(): Promise<{ data: { success: boolean } } | { error: string }> {
  return { error: 'Not implemented' }
}

export async function createCheckoutSession(
  _organizationId: string,
  _priceId: string
): Promise<{ sessionUrl?: string }> {
  return {}
}

export async function createCustomerPortal(
  _organizationId: string
): Promise<{ portalUrl?: string }> {
  return {}
}
