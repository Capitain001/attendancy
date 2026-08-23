// src/lib/toast/custom-toast.tsx
import { NotificationBarToast } from "@/components/notification/toast/NotificationBarToast"
import { toast as sonner } from "sonner"

interface NotificationBarToastOptions {
  message: string
  duration?: number
}

export const  toast  = {
    success: (message: string) => sonner.success(message),
    error: (message: string) => sonner.error(message),
    info: (message: string) => sonner.info(message),
    
    notificationBar: (options: NotificationBarToastOptions) => {
        console.log("[notif] Calling toast.notificationBar with message:", options.message)
        return sonner.custom((id) => <NotificationBarToast id={id} message={options.message} />, {
            duration: options.duration ?? 5000,
            position: "top-center",
    })
  },
}

