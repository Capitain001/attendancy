import { getSubscriptionAction, getPlansAction } from '@/services/subscription'
import type { GetSubscriptionDto, PlanDto } from '@/services/subscription'
import { getUserInfo } from '@/modules/user'
import { SubscribeButton, ManageSubscriptionButton } from '@/components/stripe'
import { redirect } from 'next/navigation'

export default async function BillingPage() {
  const user = await getUserInfo()
  if (!user) redirect('/login')

  const [subscriptionResult, plansResult] = await Promise.all([
    getSubscriptionAction(),
    getPlansAction(),
  ])

  const subscription = ('data' in subscriptionResult ? subscriptionResult.data : null) ?? null
  const plans = ('data' in plansResult ? plansResult.data : null) ?? []

  const currentPlanId = subscription?.plan?.id

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Abonnement</h1>

      <CurrentPlanCard subscription={subscription} />

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Plans disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlanId}
              hasActiveSubscription={!!subscription}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  TRIALING: { label: "Période d'essai", className: 'text-blue-600' },
  ACTIVE: { label: 'Actif', className: 'text-green-600' },
  PAST_DUE: { label: 'Paiement en retard', className: 'text-red-500' },
  CANCELED: { label: 'Annulé', className: 'text-muted-foreground' },
  EXPIRED: { label: 'Expiré', className: 'text-red-500' },
}

function CurrentPlanCard({ subscription }: { subscription: GetSubscriptionDto }) {
  if (!subscription) {
    return (
      <div className="rounded-lg border p-6 space-y-2">
        <h2 className="text-lg font-medium">Plan actuel</h2>
        <p className="text-sm text-muted-foreground">Aucun abonnement actif.</p>
      </div>
    )
  }

  const { label, className } = STATUS_CONFIG[subscription.status] ?? {
    label: subscription.status,
    className: '',
  }

  return (
    <div className="rounded-lg border p-6 space-y-3">
      <h2 className="text-lg font-medium">Plan actuel</h2>
      <div className="flex items-center gap-3">
        <span className="font-semibold">{subscription.plan?.name ?? '—'}</span>
        <span className={`text-sm font-medium ${className}`}>{label}</span>
      </div>
      {subscription.currentPeriodEnd && (
        <p className="text-sm text-muted-foreground">
          Renouvellement le{' '}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      <ManageSubscriptionButton
        className="mt-2 text-sm underline underline-offset-2"
        disabled
      >
        Gérer l'abonnement
      </ManageSubscriptionButton>
    </div>
  )
}

function PlanCard({
  plan,
  isCurrent,
  hasActiveSubscription,
}: {
  plan: PlanDto
  isCurrent: boolean
  hasActiveSubscription: boolean
}) {
  const price = plan.priceMonthly
    ? `${Number(plan.priceMonthly).toLocaleString('fr-FR')} ${plan.currency} / mois`
    : 'Gratuit'

  const features = Array.isArray(plan.features) ? (plan.features as string[]) : []

  return (
    <div className={`rounded-lg border p-5 space-y-4 ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{plan.name}</h3>
          {isCurrent && (
            <span className="text-xs font-medium text-primary">Plan actuel</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{price}</p>
      </div>

      {features.length > 0 && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span aria-hidden>✓</span>
              {f}
            </li>
          ))}
        </ul>
      )}

      <SubscribeButton
        planId={plan.id}
        className="w-full rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground disabled:opacity-50"
        disabled={isCurrent || hasActiveSubscription}
      >
        {isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
      </SubscribeButton>
    </div>
  )
}
