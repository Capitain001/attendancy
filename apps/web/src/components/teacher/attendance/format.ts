// `rate` : pourcentage entier 0–100 (convention de policy.ts), null si aucune séance décomptée.
export function formatRate(rate: number | null) {
  return rate === null ? '—' : `${rate} %`
}

export function getRateTextTone(rate: number | null) {
  if (rate === null) return 'text-muted-foreground'
  if (rate >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (rate >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-destructive'
}

export function getRateBarTone(rate: number | null) {
  if (rate === null) return 'bg-muted-foreground/30'
  if (rate >= 85) return 'bg-emerald-500'
  if (rate >= 70) return 'bg-amber-500'
  return 'bg-destructive'
}

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' })
const sessionDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatShortDate = (date: Date) => shortDate.format(date)
export const formatSessionDate = (date: Date) => sessionDate.format(date)

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count > 1 ? pluralForm : singular}`
