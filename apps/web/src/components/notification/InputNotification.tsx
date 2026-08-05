// src/components/notification/UserNotificationTest.tsx
"use client"

import { useState } from 'react'
import { useUserNotification } from '@/hooks/notification/useUserNotification'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { 
  Bell, 
  BellOff, 
  Send, 
  RefreshCw, 
  Smartphone
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { FormButton } from '../auth/ui/FormButton'

export function InputNotification() {
  const { state, isLoading, error, actions } = useUserNotification()
  const [message, setMessage] = useState('Test de notification 🔔')



  const handleSendNotification = async () => {
    await  actions.sendNotification(message)
  }




  return (
    <div className="">

          <div className="flex gap-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message de test"
              className="flex-1"
            />
            <Button
              onClick={handleSendNotification}
              disabled={isLoading || !state.subscription || state.subscriptions?.length === 0}
              className="gap-2 border-accent-foreground"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Envoyer
            </Button>

            <FormButton text="Envoyer" className='h-10' loading={isLoading} onClick={handleSendNotification} icon={<Send className="size-4"  />} />
            
          </div>
          {(!state.subscription || state.subscriptions?.length === 0) && (
            <p className="text-sm text-muted-foreground">
              ⚠️ Vous devez être abonné pour envoyer des notifications
            </p>
          )}
   
   
    </div>
  )
}

