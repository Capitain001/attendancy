// src/services/session/policy.ts
// Logique pure de cycle de vie d'une session enseignant.
// Pas de React, pas de DB — testable en isolation.
import type { Session } from '@/generated/prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DBSession = Pick<Session, 'id' | 'status' | 'checkIn'> | null

/**
 * Présence de la session en DB — abstraction sur DBSession.status
 * Evite de propager les strings DB dans la logique UI.
 */
export type SessionPresence =
  | 'NOT_STARTED'  // session null
  | 'ACTIVE'       // session ACTIVE en DB
  | 'COMPLETED'    // session COMPLETED en DB

/*
 * Cycle de vie d'une session
 * ─────────────────────────────────────────────────────────────
 * timeline : [start-15]──[start]──[start+15]──[end]──[end+15]
 *
 * upcoming : {
 *   - phase  : before (now < start-15)
 *   - session: ignorée
 *   - actions: aucune
 * }
 *
 * can-check-in : {
 *   - phase  : checkin [start-15 → start+15]
 *   - session: NOT_STARTED
 *   - actions: démarrer la session
 *   - isLate : false si now < start / true si now > start
 * }
 *
 * ongoing : {
 *   - phase  : checkin (session déjà ACTIVE) ou ongoing [start+15 → end]
 *   - session: ACTIVE
 *   - actions: aucune (session en cours)
 * }
 *
 * can-check-out : {
 *   - phase  : checkout [end → end+15] ou after (end+15 dépassé)
 *   - session: ACTIVE
 *   - actions: clôturer la session
 *   - isLate : false si phase=checkout / true si phase=after (late-checkout)
 *   - note   : si phase=after, checkOut enregistré = schedule.endTime (pas now)
 * }
 *
 * done : {
 *   - session: COMPLETED (priorité absolue, quelle que soit la phase)
 *   - actions: aucune
 * }
 *
 * missed : {
 *   - phase  : after (end+15 dépassé)
 *   - session: NOT_STARTED
 *   - actions: aucune — teacher absent
 * }
 *
 * isLate (flag orthogonal à uiStatus) : {
 *   - can-check-in + now > start → isLate=true  (retard check-in)
 *   - can-check-out + phase=after → isLate=true (late-checkout)
 * }
 * ─────────────────────────────────────────────────────────────
 */
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

// ─── Constantes de seuil (minutes) ───────────────────────────────────────────
export const SESSION_THRESHOLDS = { checkIn: 15, checkOut: 15 } as const

// ─── Fonctions pures ──────────────────────────────────────────────────────────

/**
 * Dérive la présence depuis la session DB.
 */
export function deriveSessionPresence(session: DBSession): SessionPresence {
  if (!session)                       return 'NOT_STARTED'
  if (session.status === 'COMPLETED') return 'COMPLETED'
  return 'ACTIVE'
}

/**
 * Logique métier pure — testable sans React.
 *
 * isLate est un flag orthogonal à uiStatus :
 *   - check-in après startTime    → uiStatus="can-check-in" + isLate=true
 *   - clôture après end+15        → uiStatus="can-check-out" + isLate=true
 */
export function deriveUISessionStatus(
  phase: TimePhase,
  presence: SessionPresence,
  isLateCheckIn: boolean,
): SessionPolicy {

  // ── COMPLETED : priorité absolue ──────────────────────────────────────────
  if (presence === 'COMPLETED') {
    return { uiStatus: 'done', canCheckIn: false, canCheckOut: false, isLate: false }
  }

  // ── Cycle terminé sans session ────────────────────────────────────────────
  if (phase === 'after' && presence === 'NOT_STARTED') {
    return { uiStatus: 'missed', canCheckIn: false, canCheckOut: false, isLate: false }
  }

  // ── Cycle normal ──────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ADOPTION ENSEIGNANT — taux de démarrage des sessions (P-27)
// ─────────────────────────────────────────────────────────────────────────────
//
// « Démarré » = un Schedule passé éligible (non CANCELED, non soft-deleted, dans
// la fenêtre) a une Session avec checkIn. Le taux = démarrés / éligibles.
// Un prof est signalé « faible démarrage » sous le seuil ET avec assez de séances
// (évite de juger sur 1-2 cours). Pur — réutilisable UI + serveur.

export const TEACHER_START_RATE_THRESHOLD = 80; // %
export const TEACHER_START_MIN_SESSIONS = 3;

export function isLowStartRate(input: {
  rate: number | null;
  eligible: number;
}): boolean {
  return (
    input.rate !== null &&
    input.eligible >= TEACHER_START_MIN_SESSIONS &&
    input.rate < TEACHER_START_RATE_THRESHOLD
  );
}
