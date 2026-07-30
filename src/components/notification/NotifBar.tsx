"use client"
import NotificationBar from '@/components/notification/NotificationBar'
import { useNotifications } from '@/hooks/notification/useNotification'

export default function NotifBar() {
  const { unread, actions } = useNotifications()


  const latest = unread[0]
  const handleClose = () => {
    if (latest) {
      actions.markAsRead(latest.id)
      console.log('Marked as read', latest.id)
    }
  }


  return (
    <NotificationBar 
      notification={latest}  
      onClose={handleClose}         
    />
  )
}