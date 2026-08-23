import { NotificationBarToast } from "@/components/notification/toast/NotificationBarToast"
import { toast } from "sonner"

interface NotificationBarToastOptions {
  message: string
  duration?: number
}

export const customToast = {
  notificationBar: (options: NotificationBarToastOptions) => {
    console.log("[notif] Calling toast.notificationBar with message:", options.message)
    return toast.custom((id) => <NotificationBarToast id={id} message={options.message} />, {
      duration: options.duration ?? 5000,
      position: "top-center",
    })
  },
}
