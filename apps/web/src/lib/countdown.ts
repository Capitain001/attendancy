// src/lib/countdown.ts

// Convention du module : toutes les durées sont en millisecondes.

export type CountdownWindow = {
  /** Durée restante jusqu'à la cible. */
  remaining: number
  /** Durée totale de la fenêtre (100 % de l'anneau). */
  total: number
}

/**
 * Décompte à afficher si `now` est dans la `window` précédant `target`,
 * sinon `null` (cible absente, déjà atteinte, ou fenêtre pas encore ouverte).
 */
export function resolveCountdownWindow(
  target: Date | null,
  now: Date,
  window: number,
): CountdownWindow | null {
  if (!target) return null
  const remaining = target.getTime() - now.getTime()
  if (remaining <= 0 || remaining > window) return null
  return { remaining, total: window }
}