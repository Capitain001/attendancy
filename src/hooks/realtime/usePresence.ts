// hooks/realtime/usePresence.ts
'use client'

import { generateUserInfo } from '@/services/user/utils'
import { UserInfo } from '@/types'
import { supabase } from '@/utils/supabase/client'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export interface PresenceRoomProps {
  roomName: string;
  user: UserInfo | null;
}

export const usePresence = (
 { roomName,
  user
}: PresenceRoomProps)  => {
  const [users, setUsers] = useState<Record<string, UserInfo>>({})

  useEffect(() => {
    if (!user) return

    const room = supabase.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState<UserInfo>()

        // Grouper par userId pour éviter les doublons (même utilisateur sur plusieurs appareils)
        const usersByUserId = new Map<string, UserInfo>()
        
        Object.entries(newState).forEach(([key, values]) => {
          const userInfo = values[0] as UserInfo
          if (!userInfo?.id) return
          
          const existingUser = usersByUserId.get(userInfo.id)
          
          // Garder la connexion la plus récente (basée sur online_at)
          if (!existingUser) {
            usersByUserId.set(userInfo.id, userInfo)
          } else {
            const existingTime = existingUser.online_at 
              ? new Date(existingUser.online_at).getTime() 
              : 0
            const newTime = userInfo.online_at 
              ? new Date(userInfo.online_at).getTime() 
              : 0
            
            if (newTime > existingTime) {
              usersByUserId.set(userInfo.id, userInfo)
            }
          }
        })

        // Convertir la Map en Record indexé par userId
        const newUsers = Object.fromEntries(usersByUserId) as Record<string, UserInfo>

        setUsers(newUsers)
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          const userPayload = generateUserInfo(
            user,
            [
              'id',
              'name',
              'avatar_url',
              'role',
              'function',
              'status',
              'organization',
              'online_at',
            ],
            {
              online_at: new Date().toISOString() 
            }
          )

          await room.track(userPayload)
        } else {
          setUsers({})
        }
      })

    return () => {
      room.unsubscribe()
    }
  }, [roomName, user])

  return { users }
}
