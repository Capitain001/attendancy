import { connection } from 'next/server'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { getCurrentTeacherId, getTeacherSchedulesAction } from '@/services/teacher'

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon…
  const diffToMonday = (day === 0 ? -6 : 1 - day)
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function formatTime(date: Date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function Page() {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  const { start, end } = getWeekBounds()
  const res = await getTeacherSchedulesAction(teacherId, start, end)
  const schedules = 'data' in res ? (res.data ?? []) : []

  // Grouper par jour
  const byDay = new Map<string, typeof schedules>()
  for (const s of schedules) {
    const key = s.startTime.toDateString()
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(s)
  }

  const weekLabel = `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Semaine du {weekLabel}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Planning</h1>
        <p className="text-sm text-muted-foreground">
          {schedules.length === 0
            ? 'Aucune séance cette semaine.'
            : `${schedules.length} séance${schedules.length > 1 ? 's' : ''} cette semaine.`}
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
          <CalendarDays className="mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aucune séance planifiée cette semaine.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(byDay.entries()).map(([dateKey, items]) => {
            const date = new Date(dateKey)
            return (
              <div key={dateKey} className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {DAY_NAMES[date.getDay()]} {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </p>
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-2 rounded-2xl border border-dashed bg-card p-4"
                  >
                    <p className="text-sm font-semibold">{s.course.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {s.room.name}
                      </span>
                      {s.class && (
                        <span className="flex items-center gap-1">
                          {s.class.name}
                          {s.group ? ` · ${s.group.name}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
