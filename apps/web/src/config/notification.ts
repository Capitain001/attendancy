import { NotificationType } from "@/generated/prisma/client";

// src/config/notification.ts
export const NOTIFICATION_CONFIG = {
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    serviceWorkerPath: '/sw.js',
    serviceWorkerScope: '/',
    defaultIcon: '/icon-192x192.png'
  } as const
  
  export const BUTTON_CONFIG: Record<NotificationPermission, { text: string; className: string }> = {
    granted: {
      text: 'Notifications activées ✅',
      className: 'bg-green-500 hover:bg-green-600'
    },
    denied: {
      text: 'Notifications bloquées ❌', 
      className: 'bg-red-500 hover:bg-red-600'
    },
    default: {
      text: 'Activer les notifications 🔔',
      className: 'bg-blue-500 hover:bg-blue-600'
    }
  }
  
  export const SYSTEM_CHECKS = [
    { id: 'https', label: 'HTTPS/Localhost' },
    { id: 'api', label: 'Notifications API' },
    { id: 'permission', label: 'Permission accordée' },
    { id: 'subscription', label: 'Abonnement actif' },
    { id: 'vapid', label: 'Clé VAPID' }
  ] as const


// Durée de validité d'un abonnement push : 1 an
export const PUSH_SUBSCRIPTION_DURATION =
  365 * 24 * 60 * 60 * 1000 // en millisecondes
  
export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  ABSENCE:         "Absence signalée",
  COURSE_CHANGE:   "Changement de cours",
  NEW_COURSE:      "Nouveau cours",
  SCHEDULE_UPDATE: "Planning modifié",
  GENERAL:         "Notification",
  MESSAGE:         "Nouveau message",
  INVITATION:      "Invitation",
};
