import { connection } from 'next/server'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { getCurrentTeacherId, getTeacherSchedulesAction } from '@/services/teacher'
import { TeacherPlanning } from '@/components/teacher/planning/TeacherPlanning'
import { getSchedulesAction } from '@/services/schedule'

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

    const schedulesResponse = await getSchedulesAction({teacherId, rangeStart:start, rangeEnd: end})
  const schedules = 'data' in schedulesResponse
   ? (schedulesResponse.data ?? []) : []

  // getSchedulesAction

  // Grouper par jour
  const byDay = new Map<string, typeof schedules>()
  for (const s of schedules) {
    const key = s.startTime.toDateString()
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(s)
  }

  const weekLabel = `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return <TeacherPlanning schedules={schedules} />;
}
