//src/components/notification/push-notification.tsx
"use client"
import { usePushNotifications } from '@/hooks/notification/usePushNotifications'
import { useState } from 'react'

import { NotificationStatus } from './Notification-status'
import { NotificationPermissionButton } from './NotificationButton'

export function PushNotificationManager() {
  const [message, setMessage] = useState('Hello!')
  const { state, isLoading, actions } = usePushNotifications()

  const handleSendNotification = async () => {
    await actions.sendNotification(message)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestionnaire de Notifications</h1>
      
      <NotificationStatus subscription={state.subscription} />
      
      <div className="space-y-4">
        <NotificationPermissionButton className="w-full" />

        {!state.subscription ? (
          <button 
            onClick={actions.subscribe}
            disabled={isLoading || !state.isGranted}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '⏳' : '🔔'} S'abonner
          </button>
        ) : (
          <button 
            onClick={actions.unsubscribe}
            disabled={isLoading}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isLoading ? '⏳' : '🔕'} Se désabonner
          </button>
        )}

        <div className="space-y-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message de test"
            className="w-full p-2 border rounded"
          />

          <button 
            onClick={handleSendNotification}
            disabled={!state.subscription}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            📤 Envoyer notification
          </button>
        </div>
      </div>
    </div>
  )
}