'use client';

import { useState } from 'react';
import { createCheckoutSession, createCustomerPortal } from '@/services/subscription';

export function useStripeActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (organizationId: string, priceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createCheckoutSession(organizationId, priceId);
      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      }
    } catch (err:any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortal = async (organizationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createCustomerPortal(organizationId);
      if (result.portalUrl) {
        window.location.href = result.portalUrl;
      }
    } catch (err:any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout: handleCheckout,
    createPortal: handlePortal,
    isLoading,
    error
  };
}