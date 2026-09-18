import type { ScheduleItem } from './types'

const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatRange({ startTime, endTime }: { startTime: Date; endTime: Date }) {
  return `${timeFormatter.format(new Date(startTime))} - ${timeFormatter.format(new Date(endTime))}`
}

export function getAudienceLabel(schedule: ScheduleItem) {
  return schedule.group ? `${schedule.class.name} · ${schedule.group.name}` : schedule.class.name
}

function getRelativeTimeString(startTime: Date) {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = start.getTime() - now.getTime()

  if (diffMs <= 0) return "Aujourd'hui"

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)))
    return `Aujourd'hui · Dans ${diffMins} min`
  }
  return `Aujourd'hui · Dans ${diffHours} h`
}

export function getPinnedLabel(schedule: ScheduleItem, schedules: ScheduleItem[]) {
  if (schedule.status === 'COMPLETED') return 'Cours terminé'
  if (schedule.status === 'CANCELED') return 'Cours annulé'
  if (schedule.status === 'MISSED') return 'Cours manqué'

  const upcoming = schedules.filter((s) => s.status === 'PENDING')
  const nextCourse = upcoming[0]

  if (nextCourse && nextCourse.id === schedule.id) {
    return 'Cours suivant'
  }

  return getRelativeTimeString(schedule.startTime)
}
