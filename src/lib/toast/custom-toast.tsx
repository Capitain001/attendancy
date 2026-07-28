// src/lib/toast/custom-toast.tsx
// Point d'entrée toast du projet — wrapper au-dessus de sonner.
// Les hooks (useCrudEntity) et composants importent d'ici, jamais sonner
// directement : changer de lib de toast = changer ce seul fichier.
'use client'
import { toast } from 'sonner'

export const customToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),

  // ⚠ À ÉTENDRE PAR PROJET — toasts custom avec composant dédié :
  // notificationBar: (options: { message: string; duration?: number }) =>
  //   toast.custom((id) => <NotificationBar id={id} message={options.message} />, {
  //     duration: options.duration ?? 5000,
  //     position: 'top-center',
  //   }),
}

export { toast }
