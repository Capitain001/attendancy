//src/services/notification/utils.ts
"use client"; 

// ✅ Fonction pour demander la permission de notification
export async function requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.error("Ce navigateur ne prend pas en charge les notifications.");
      return false;
    }
  
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  // ✅ Fonction pour afficher une notification
  export function showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === "granted") {
      new Notification(title, options);
    } else {
      console.warn("Permission de notification non accordée.");
    }
  }
  

//fonctions pour la serialisation de la subscription
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    return window.btoa(String.fromCharCode(...bytes))
  }
  
  export function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const buffer = new ArrayBuffer(rawData.length)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < rawData.length; i++) {
      bytes[i] = rawData.charCodeAt(i)
    }
    return bytes
  }
  
  export function serializeSubscription(subscription: PushSubscription) {
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!)
      }
    }
  }

  


  
