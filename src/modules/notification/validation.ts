    // src/services/notification/validation.ts

import { NOTIFICATION_CONFIG } from "@/config/notification"


    export function validateEnvironment(): void {
    if (!NOTIFICATION_CONFIG.vapidPublicKey) {
        throw new Error('Clé VAPID manquante dans la configuration')
    }
    }

    export function validateBrowserSupport(): void {
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) throw new Error('Notifications API non supportée')
        if (!('serviceWorker' in navigator)) throw new Error('Service Worker non supporté')
        if (!('PushManager' in window)) throw new Error('Push API non supportée')
      }
    export function checkBrowserSupport(): boolean {
    try {
        validateBrowserSupport()
        return true
    } catch {
        return false
    }
    }

    export function validateHTTPS(): boolean {
        if (typeof window === 'undefined') return false
        return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      }
      
    export function getCurrentPermission(): NotificationPermission {
        if (typeof window === 'undefined') return 'default'
        return Notification.permission
      }