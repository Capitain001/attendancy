// src/lib/toast/custom-toast.tsx
// directement : changer de lib de toast = changer ce seul fichier.

import { NotificationBarToast } from "@/components/notification/toast/NotificationBarToast"
import { toast } from "sonner"

interface NotificationBarToastOptions {
  message: string
  duration?: number
}

export const customToast = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    
    notificationBar: (options: NotificationBarToastOptions) => {
        console.log("[notif] Calling customToast.notificationBar with message:", options.message)
        return toast.custom((id) => <NotificationBarToast id={id} message={options.message} />, {
            duration: options.duration ?? 5000,
            position: "top-center",
    })
  },
}

