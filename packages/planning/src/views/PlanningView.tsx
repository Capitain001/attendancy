'use client'

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
              <div key={slot.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{slot.courseName}</div>
                <div className="text-muted-foreground">
                  {slot.startTime} – {slot.endTime}
                  {slot.roomName && ` · ${slot.roomName}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
