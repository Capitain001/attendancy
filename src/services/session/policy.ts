// src/services/session/policy.ts
// Logique pure de cycle de vie d'une session enseignant.
// Pas de React, pas de DB — testable en isolation.
import type { Session } from '@/generated/prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DBSession = Pick<Session, 'id' | 'status' | 'checkIn'> | null

export type SessionPresence = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED'

export type UISessionStatus =
  | 'upcoming'      // avant la fenêtre check-in
  | 'can-check-in'  // fenêtre check-in ouverte, pas de session
  | 'ongoing'       // session en cours (start+15 → end)
  | 'can-check-out' // fenêtre check-out ou après, session ACTIVE
  | 'done'          // session COMPLETED
  | 'missed'        // cycle terminé, pas de session

export type TimePhase = 'before' | 'checkin' | 'ongoing' | 'checkout' | 'after'

export interface SessionPolicy {
  uiStatus: UISessionStatus
  canCheckIn: boolean
  canCheckOut: boolean
  isLate: boolean
}

// ─── Fonctions pures ──────────────────────────────────────────────────────────

export function deriveSessionPresence(session: DBSession): SessionPresence {
  if (!session)                       return 'NOT_STARTED'
  if (session.status === 'COMPLETED') return 'COMPLETED'
  return 'ACTIVE'
}

export function deriveUISessionStatus(
  phase: TimePhase,
  presence: SessionPresence,
  isLateCheckIn: boolean,
): SessionPolicy {
  if (presence === 'COMPLETED') {
    return { uiStatus: 'done', canCheckIn: false, canCheckOut: false, isLate: false }
  }

  if (phase === 'after' && presence === 'NOT_STARTED') {
    return { uiStatus: 'missed', canCheckIn: false, canCheckOut: false, isLate: false }
  }

  const uiStatus: UISessionStatus = (() => {
    switch (phase) {
      case 'before':   return 'upcoming'
      case 'checkin':  return presence === 'ACTIVE' ? 'ongoing' : 'can-check-in'
      case 'ongoing':  return 'ongoing'
      case 'checkout':
      case 'after':    return 'can-check-out'
    }
  })()

  const isLate =
    (isLateCheckIn && presence === 'NOT_STARTED') ||
    (phase === 'after' && presence === 'ACTIVE')

  return {
    uiStatus,
    canCheckIn:  presence === 'NOT_STARTED' && phase === 'checkin',
    canCheckOut: presence === 'ACTIVE' && (phase === 'checkout' || phase === 'after'),
    isLate,
  }
}

// ─── Constantes de seuil (minutes) ───────────────────────────────────────────
export const SESSION_THRESHOLDS = { checkIn: 15, checkOut: 15 } as const
