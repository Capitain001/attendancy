import { NOTIFICATION_CONFIG } from '@/config/notification'

// ─── Enregistrement ───────────────────────────────────────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service Worker non supporté')
  }

  const registration = await navigator.serviceWorker.register(
    NOTIFICATION_CONFIG.serviceWorkerPath,
    { scope: NOTIFICATION_CONFIG.serviceWorkerScope, updateViaCache: 'none' },
  )

  if (registration.installing) {
    await new Promise<void>((resolve) => {
      registration.installing!.addEventListener('statechange', function () {
        if (this.state === 'activated') resolve()
      })
    })
  }

  return registration
}

// ─── Récupération avec fallback + timeout ────────────────────────────────────

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service Worker non supporté')
  }

  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout : Service Worker non activé après 10s')), 10_000),
    )
    try {
      return await Promise.race([navigator.serviceWorker.ready, timeout])
    } catch {
      return registerServiceWorker()
    }
  }

  return registerServiceWorker()
}

// ─── Abonnement actuel ────────────────────────────────────────────────────────

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const reg = await getServiceWorkerRegistration()
    return reg.pushManager.getSubscription()
  } catch {
    return null
  }
}
