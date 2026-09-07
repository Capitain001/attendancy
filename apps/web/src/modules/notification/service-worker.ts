//src/modules/notification/service-worker.ts
import { NOTIFICATION_CONFIG } from '@/config/notification'
import { urlBase64ToUint8Array, withTimeout } from './utils'

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


// ─── Création d'abonnement (navigateur) ────────────────────────────────────

/**
 * Crée un nouvel abonnement push côté navigateur, en remplaçant un éventuel
 * abonnement existant. Ne fait aucun appel serveur.
 */
export async function registerBrowserSubscription(vapidPublicKey: string): Promise<PushSubscription> {
  const registration = await withTimeout(
    getServiceWorkerRegistration(),
    15_000,
    "Le service worker n'a pas répondu à temps",
  )

  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    // Un échec de désabonnement de l'ancien abonnement n'est pas bloquant.
    await existing.unsubscribe().catch(() => undefined)
  }

  return withTimeout(
    registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    }),
    10_000,
    "La création de l'abonnement navigateur a expiré",
  )
}