export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service Worker non supporté')
  }
  const reg = await navigator.serviceWorker.ready
  return reg
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const reg = await getServiceWorkerRegistration()
    return reg.pushManager.getSubscription()
  } catch {
    return null
  }
}
