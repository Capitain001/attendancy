// components/notification/NotificationStatusCard.tsx
"use client"

import { UserNotificationState } from '@/hooks/notification/useUserNotification'
import { CheckCircle2, Shield, Key, Bell, Globe, CloudCheck } from 'lucide-react'

export function NotificationStatusCard({state}: {state:UserNotificationState}) {

  const isActif = state.isSupported && state.isGranted && state.isHTTPS && state.hasVAPID 
  const statusItems = [
    {
      id: 'browser',
      label: 'Support navigateur',
      value: state.isSupported,
      icon: Globe ,
      description: 'Votre navigateur supporte les notifications'
    },
    {
      id: 'permission',
      label: 'Permission',
      value: state.isGranted,
      icon: Shield,
      description: 'Autorisation d\'envoyer des notifications'
    },
    {
      id: 'security',
      label: 'Connexion sécurisée',
      value: state.isHTTPS,
      icon: CloudCheck,
      description: 'Connexion HTTPS requise'
    },
    {
      id: 'vapid',
      label: 'Clés VAPID',
      value: state.hasVAPID,
      icon: Key,
      description: 'Clés de chiffrement configurées'
    },
    // {
    //   id: 'subscription',
    //   label: 'Abonnement actif',
    //   value: !!state.subscription,
    //   icon: Bell,
    //   description: 'Abonnement aux notifications push'
    // },

    // {
    //   id: 'operationel',
    //   label: '',
    //   value: isActif,
    //   icon: CheckCircle2,
    //   description: 'notifications push activees'
    // }
  ]
  return (
<div className="
  grid 
  grid-cols-2        /* mobile */
  sm:grid-cols-2     /* petit écran */   
  gap-2
">
  {statusItems.map((item) => {
    const Icon = item.icon
    return (
      <div key={item.id}  
       className={`flex items-center bg-muted rounded-lg px-4 h-18 w-full border hover:bg-muted/50 transition-all hover:shadow-sm justify-between

      `}>
               {/* ${item.id === 'operationel' ? 'lg:hidden' : ''} */}
        <div className="flex items-center gap-3">
          <div className={`p-2 ${item.value ? 'text-green-600' : 'text-gray-400'}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className='flex flex-col jusctify-center'>
            <p className="font-medium text-sm">{item.label}</p>

            <span className="text-xs  text-muted-foreground">
              {item.value ? (
                <span className="text-green-600 flex items-center gap-2 text-base ">
                  <CheckCircle2 className="h-4 w-4" /> OK
                </span>
              ): (
                <p >{item.description}</p>
              )}
            </span>
          </div>
        </div>
      </div>
    )
  })}
</div>

  )
}

