"use client"

import { supabase } from '@/utils/supabase/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'

const EVENT_NAME = 'realtime-item-move'

/**
 * Hook de throttle réutilisable
 */
const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number
) => {
  const lastCall = useRef(0)
  const timeout = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Params) => {
      const now = Date.now()
      const remainingTime = delay - (now - lastCall.current)

      if (remainingTime <= 0) {
        if (timeout.current) {
          clearTimeout(timeout.current)
          timeout.current = null
        }
        lastCall.current = now
        callback(...args)
      } else if (!timeout.current) {
        timeout.current = setTimeout(() => {
          lastCall.current = Date.now()
          timeout.current = null
          callback(...args)
        }, remainingTime)
      }
    },
    [callback, delay]
  )
}

export const useRealtimeDraggableItem = ({
  roomName,
  itemId,
  throttleMs = 50,
  isDragging = false,
}: {
  roomName: string
  itemId: string
  throttleMs?: number
  isDragging?: boolean
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const channelRef = useRef<RealtimeChannel | null>(null)
  const payloadRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Throttled broadcast + persistance DB
  const broadcastPosition = useThrottleCallback(
    async (pos: { x: number; y: number }) => {
      payloadRef.current = pos

      // Broadcast Realtime
      channelRef.current?.send({
        type: 'broadcast',
        event: EVENT_NAME,
        payload: { itemId, x: pos.x, y: pos.y },
      })

      // Persistance en DB (upsert)
      const { error } = await supabase
        .from('RealtimeItem')
        .upsert(
          {
            id: crypto.randomUUID(),
            itemId,
            roomName,
            x: pos.x,
            y: pos.y,
            updatedAt: new Date().toISOString(),
          },
          { onConflict: 'itemId,roomName' }
        )
      if (error) console.error('Error upserting RealtimeItem:', error)
    },
    throttleMs
  )

  // Use refs pour accéder aux dernières valeurs
  const isDraggingRef = useRef(isDragging)
  const positionRef = useRef(position)

  useEffect(() => {
    isDraggingRef.current = isDragging
    positionRef.current = position
  }, [isDragging, position])

  // Récupération initiale depuis DB + setup Realtime
  useEffect(() => {
    const fetchPosition = async () => {
      const { data } = await supabase
        .from('RealtimeItem')
        .select('x,y')
        .eq('itemId', itemId)
        .eq('roomName', roomName)
        .single()

      if (data) setPosition({ x: data.x, y: data.y })
    }

    fetchPosition()

    const channel = supabase.channel(roomName)

    channel
      .on('broadcast', { event: EVENT_NAME }, (data: { payload: any }) => {
        if (data.payload.itemId !== itemId) return
        // Ignore updates si on est en train de drag
        if (isDraggingRef.current) return
        setPosition({ x: data.payload.x, y: data.payload.y })
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          channelRef.current = channel
          // envoyer la position actuelle au cas où un nouvel utilisateur rejoint
          channelRef.current?.send({
            type: 'broadcast',
            event: EVENT_NAME,
            payload: { itemId, ...positionRef.current },
          })
        } else {
          channelRef.current = null
        }
      })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [itemId, roomName])

  return { position, broadcastPosition }
}
