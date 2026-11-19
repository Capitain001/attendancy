// Règles partagées : le serveur (policy), l'inbox et la réception d'un pair appliquent les mêmes.
export const MAX_BACKDATE_MS = 7 * 86_400_000
export const MAX_CONTENT_LENGTH = 4000 // en caractères Unicode (le hub compte pareil)

// La date déclarée n'est retenue que si elle est plausible (ni futur, ni plus vieille que la limite).
// NaN échoue aux deux comparaisons : une date invalide est donc non fiable.
export function isTrustedCreatedAt(createdAt: Date, now: Date): boolean {
  const t = createdAt.getTime()
  return t <= now.getTime() && t >= now.getTime() - MAX_BACKDATE_MS
}
