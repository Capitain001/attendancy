// `rate` : pourcentage entier 0–100 (convention de policy.ts), null si aucune séance décomptée.
export function formatRate(rate: number | null) {
  return rate === null ? '—' : `${rate}%`
}

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count > 1 ? pluralForm : singular}`

export const initials = (firstName: string | null, lastName: string | null) =>
  [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'