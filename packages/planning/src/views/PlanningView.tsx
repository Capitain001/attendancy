'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@attendancy/ui'
import { usePlanning } from '../hooks/usePlanning'

function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

type Props = {
  classId: string
  from: string
  to: string
}

export function PlanningView({ classId, from, to }: Props) {
  const isOnline = useOnlineStatus()
  const { data, isLoading, isError, isStale } = usePlanning(classId, from, to)

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
  if (isError && !data)   return <div className="p-4 text-sm text-destructive">Erreur de chargement</div>
  if (!data?.length) return <div className="p-4 text-sm">Aucun cours cette semaine.</div>

  return (
    <div className="space-y-4 p-4">
      {(!isOnline || isStale) && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
          {isOnline ? 'Données depuis le cache — actualisation en cours…' : 'Hors ligne — données du cache local'}
        </div>
      )}
      {data.map((day) => (
        <div key={day.date}>
          <p className="font-semibold text-sm mb-2">{day.date}</p>
          <div className="space-y-2">
            {day.slots.map((slot) => (
              <Card key={slot.id}>
                <CardHeader className="pb-1 pt-3 px-3">
                  <span className="font-medium text-sm">{slot.courseName}</span>
                </CardHeader>
                <CardContent className="pb-3 px-3 pt-0 text-xs text-muted-foreground">
                  {slot.startTime} – {slot.endTime}
                  {slot.roomName && ` · ${slot.roomName}`}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
