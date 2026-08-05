'use client'

import { Card, CardContent, CardHeader } from '@attendancy/ui'
import { usePlanning } from '../hooks/usePlanning'

type Props = {
  classId: string
  from: string
  to: string
}

export function PlanningView({ classId, from, to }: Props) {
  const { data, isLoading, isError } = usePlanning(classId, from, to)

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
  if (isError)   return <div className="p-4 text-sm text-destructive">Erreur de chargement</div>
  if (!data?.length) return <div className="p-4 text-sm">Aucun cours cette semaine.</div>

  return (
    <div className="space-y-4 p-4">
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
