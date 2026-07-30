// src/components/notification/NotificationStatusCardsCompact.tsx
"use client"

import { UserNotificationState, useUserNotification } from '@/hooks/notification/useUserNotification'
import { SYSTEM_CHECKS } from '@/config/notification'


export function NotificationStatusCards({state, isLoading }: { isLoading: boolean , state:UserNotificationState})  {
//   const { state, isLoading } = useUserNotification()

  const checkStatus = (checkId: string): boolean => {
    switch (checkId) {
      case 'https': return state.isHTTPS
      case 'api': return state.isSupported
      case 'permission': return state.isGranted
      case 'subscription': return !!state.subscription
      case 'vapid': return state.hasVAPID
      default: return false
    }
  }



  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2 p-2">
        {SYSTEM_CHECKS.map((check) => (
          <div
            key={check.id}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-full animate-pulse"
          >
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 p-2">
      {SYSTEM_CHECKS.map((check) => {
        const status = checkStatus(check.id)
        
        return (
            
          <div
            key={check.id}
            className={`
             flex items-center gap-3 p-3 rounded-lg border
             ${status ? '' : 'bg-muted/50'}
            `}
            title={status ? `${check.label}: activer` : `${check.label}: desactiver`}
          >

            <span className="font-medium">{check.label}</span>
          </div>
        )
      })}
    </div>
  )
}



/* export  function NotifStatusGrid() {
    const Icon = iconMap[check.id]
    const status = checkStatus(check.id)
    
    return (
      <div
        key={check.id}
        className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-muted/50 hover:shadow-sm"
      >
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {check.label}
          </p>
          {renderStatusContent(check.id, status)}
        </div>
      </div>
    )
  })}
</div>
}
 */