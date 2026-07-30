"use client"

import { useState } from "react"
import { toast } from "sonner"
import NotificationBar from "../NotificationBar"
import { useNotifications } from "@/hooks/notification/useNotification"


interface NotificationBarToastProps {
  id: string | number
  message: string
}

export function NotificationBarToast({ id, message }: NotificationBarToastProps) {
  const [show, setShow] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { unread, actions } = useNotifications()
  
  const latest = unread[0]
  const handleClose = () => {
    setShow(false)
    setTimeout(() => toast.dismiss(id), 300)
    if (latest) {
      actions.markAsRead(latest.id)
      console.log('Marked as read', latest.id)
    }
  }





  return (
    <div className="w-full flex justify-center">
      <NotificationBar
        notification={latest}
        isCollapsed={isCollapsed}
        show={show}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        onClose={handleClose}
      />
    </div>
  )
}
