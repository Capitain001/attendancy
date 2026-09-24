import type { ScheduleItem, ScheduleWithUi } from './types'

const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatRange({ startTime, endTime }: { startTime: Date; endTime: Date }) {
  return `${timeFormatter.format(startTime)} - ${timeFormatter.format(endTime)}`
}

export function getAudienceLabel(schedule: ScheduleItem) {
  return schedule.group ? `${schedule.class.name} · ${schedule.group.name}` : schedule.class.name
}

function getRelativeTimeString(startTime: Date, now: Date) {
  const diffMs = startTime.getTime() - now.getTime()

  if (diffMs <= 0) return "Aujourd'hui"

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)))
    return `Aujourd'hui · Dans ${diffMins} min`
  }
  return `Aujourd'hui · Dans ${diffHours} h`
}

/**
 * `schedules` doit être trié par startTime croissant (fait dans DailyScheduleView).
 * Toute la logique temporelle est déjà résolue dans `uiStatus`
 * (via resolveScheduleUiStatus) : ici on ne relit plus le statut DB brut.
 */
export function getPinnedLabel(
  schedule: ScheduleWithUi,
  schedules: ScheduleWithUi[],
  now: Date,
) {
  switch (schedule.uiStatus) {
    case 'COMPLETED':
      return 'Cours terminé'
    case 'CANCELED':
      return 'Cours annulé'
    case 'MISSED':
      return 'Cours manqué'
    case 'ONGOING':
      return 'En cours'
  }

  // uiStatus === 'PENDING' : réellement à venir (now < startTime)
  const next = schedules.find((s) => s.uiStatus === 'PENDING')
  if (next?.id === schedule.id) return 'Cours suivant'

  return getRelativeTimeString(schedule.startTime, now)
}