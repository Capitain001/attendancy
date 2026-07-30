'use client';

import { useState } from 'react';

// TODO: Intégration Stripe à implémenter.
// Le modèle Subscription (billing.prisma) ne contient pas encore les champs Stripe
// (stripe_customer_id, stripe_subscription_id). À ajouter via migration + actions
// dans src/services/subscription/actions/stripe.mutations.ts avant d'activer ces hooks.

export function useStripeActions() {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>('Intégration Stripe non disponible');

  const handleCheckout = async (_organizationId: string, _priceId: string) => {
    throw new Error('Stripe non disponible — voir CLAUDE.md du service subscription')
  };

  const handlePortal = async (_organizationId: string) => {
    throw new Error('Stripe non disponible — voir CLAUDE.md du service subscription')
  };

  return {
    createCheckout: handleCheckout,
    createPortal: handlePortal,
    isLoading,
    error,
  };
}
