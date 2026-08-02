// src/services/service-worker-service.ts

import { NOTIFICATION_CONFIG } from "@/config/notification"
import { validateBrowserSupport } from "./validation"

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  validateBrowserSupport()

  const registration = await navigator.serviceWorker.register(
    NOTIFICATION_CONFIG.serviceWorkerPath,
    {
      scope: NOTIFICATION_CONFIG.serviceWorkerScope,
      updateViaCache: 'none'
    }
  )

  if (registration.installing) {
    await new Promise<void>((resolve) => {
      registration.installing!.addEventListener('statechange', function() {
        if (this.state === 'activated') resolve()
      })
    })
  }

  return registration
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  // Vérifier si un service worker est déjà enregistré
  if (navigator.serviceWorker.controller) {
    // Service worker déjà actif, récupérer la registration
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      return registration
    }
  }

  // Vérifier si une registration existe déjà
  const existingRegistration = await navigator.serviceWorker.getRegistration()
  if (existingRegistration) {
    // Attendre que le service worker soit prêt avec timeout
    const readyPromise = navigator.serviceWorker.ready
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Service worker n\'a pas pu être activé dans les 10 secondes')), 10000)
    })
    
    try {
      return await Promise.race([readyPromise, timeoutPromise])
    } catch (error) {
      console.warn('Service worker ready timeout, tentative d\'enregistrement...')
      // Si ready échoue, essayer d'enregistrer
      return await registerServiceWorker()
    }
  }

  // Aucun service worker enregistré, en enregistrer un nouveau
  console.log('📋 Enregistrement d\'un nouveau service worker...')
  return await registerServiceWorker()
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getServiceWorkerRegistration()
  return registration.pushManager.getSubscription()
}