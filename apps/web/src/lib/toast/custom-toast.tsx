import { NotificationBarToast } from "@/components/notification/toast/NotificationBarToast"
import { toast as sonner } from "sonner"

interface NotificationBarToastOptions {
  message: string
  duration?: number
}

// `id` optionnel : deux toasts avec le même id n'en font qu'un (évite le doublon du Strict Mode en dev).
export const toast = {
  success: (message: string, id?: string) => sonner.success(message, { id }),
  error: (message: string, id?: string) => sonner.error(message, { id }),
  info: (message: string, id?: string) => sonner.info(message, { id }),

  notificationBar: (options: NotificationBarToastOptions) => {
    console.log("[notif] Calling toast.notificationBar with message:", options.message)
    return sonner.custom((id) => <NotificationBarToast id={id} message={options.message} />, {
      duration: options.duration ?? 5000,
      position: "top-center",
    })
  },
}