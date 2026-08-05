'use client'

import { generateUserInfo } from '@/modules/user'
import { UserInfo } from '@/types'
import { supabase } from '@/utils/supabase/client'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export const usePresenceRoom = (
  roomName: string,
  user: UserInfo | null
) => {
  const [users, setUsers] = useState<Record<string, UserInfo>>({})

  useEffect(() => {
    if (!user) return

    const room = supabase.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState<UserInfo>()

        const newUsers = Object.fromEntries(
          Object.entries(newState).map(([key, values]) => [
            key,
            values[0] as UserInfo,
          ])
        )

        setUsers(newUsers)
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          const userPayload = generateUserInfo(user, [
            'id',
            'name',
            'avatar_url',
            'role',
            'function',
            'status',
            'organization',
            'online_at',
          ])

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
