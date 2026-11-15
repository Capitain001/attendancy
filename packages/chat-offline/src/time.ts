const DAY = 86_400_000

// À appeler côté serveur. `now` est créé une fois par l'action et passé ici.
// Un message écrit hors ligne garde son heure d'écriture, sans pouvoir être
// antidaté de plus de `maxPastMs` ni daté dans le futur.
export function clampSentAt({
  sentAt,
  now,
  maxPastMs = 7 * DAY,
}: {
  sentAt?: string | Date | null
  now: Date
  maxPastMs?: number
}) {
  if (!sentAt) return now
  const t = (sentAt instanceof Date ? sentAt : new Date(sentAt)).getTime()
  if (Number.isNaN(t)) return now
  return new Date(Math.min(Math.max(t, now.getTime() - maxPastMs), now.getTime()))
}
