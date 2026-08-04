//src/components/notification/Notification-status.tsx
"use client"

import { useState, useEffect } from 'react'
import { SYSTEM_CHECKS } from '@/config/notification'
import { validateHTTPS, getCurrentPermission } from '@/modules/notification'

interface NotificationStatusProps {
  subscription: PushSubscription | null
  className?: string
}

export function NotificationStatus({ subscription, className = '' }: NotificationStatusProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const permission = isClient ? getCurrentPermission() : 'default'
  
  const checkStatus = (checkId: string) => {
    if (!isClient) return false // Retourne false côté serveur pour éviter l'hydratation
    
    switch (checkId) {
      case 'https': return validateHTTPS()
      case 'api': return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
      case 'permission': return permission === 'granted'
      case 'subscription': return !!subscription
      case 'vapid': return !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      default: return false
    }
  }

  return (
    <div className={`p-4 rounded ${className}`}>
      <h3 className="font-semibold mb-3">État du Système</h3>
      <div className="space-y-2">
        {SYSTEM_CHECKS.map((check) => {
          const status = checkStatus(check.id)
          return (
            <div key={check.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{check.label}:</span>
              <span className={status ? 'text-base' : 'text-red-600'}>
                {status ? '✅' : '❌'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}