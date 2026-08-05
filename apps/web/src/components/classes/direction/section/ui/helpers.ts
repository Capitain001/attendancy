import type { ScheduleStatus } from './types'

export const SCHEDULE_STATUS_CONFIG: Record<ScheduleStatus, { label: string; dot: string; badge: string }> = {
  PENDING:   { label: 'Prévu',    dot: 'bg-blue-400',       badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  COMPLETED: { label: 'Effectué', dot: 'bg-foreground/30',  badge: 'bg-foreground/5 text-foreground/50' },
  CANCELED:  { label: 'Annulé',   dot: 'bg-red-400',        badge: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' },
  MISSED:    { label: 'Manqué',   dot: 'bg-red-400',        badge: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300' },
}

export function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function sessionDurationHours(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000
}
