// src/services/planning/policy.ts
//
// Règles métier PURES du domaine Planning (testables sans React, partagées
// client ⇄ serveur). Source de vérité unique : les gardes UI (UX) et
// l'enforcement serveur (mutations schedule) consomment ces mêmes fonctions.
//
// Certaines règles sont *aussi* appliquées en base (contraintes/triggers Postgres,
// cf. prisma/migrations/20260511220000_schedule_constraints) — la DB reste l'autorité ;
// ces helpers servent à anticiper/expliquer côté code sans réinventer la logique.

// ─────────────────────────────────────────────────────────────────────────────
// R1 — On ne planifie pas une séance sur un créneau écoulé
// ─────────────────────────────────────────────────────────────────────────────
//
// Frontière = la FIN du créneau (pas le début) :
//   - autorise le créneau EN COURS (replanifier « maintenant »),
//   - bloque tout créneau ENTIÈREMENT passé,
//   - absorbe la friction drag/horloge sans constante de tolérance arbitraire.
// S'applique à la création (dialogue), au déplacement drag&drop, et au serveur
// (createScheduleAction / updateScheduleAction).

/** Message utilisateur partagé (actions serveur). */
export const PAST_SLOT_ERROR = "On ne planifie pas de séance sur une date passée.";

/**
 * Un créneau est « écoulé » quand sa fin est <= maintenant.
 * `end` absent → on retombe sur `start`.
 */
export function isSlotElapsed(
  slot: { start: Date | string; end?: Date | string | null },
  now: number = Date.now(),
): boolean {
  const end = slot.end ?? slot.start;
  return new Date(end).getTime() <= now;
}

// ─────────────────────────────────────────────────────────────────────────────
// R2 — Intégrité temporelle d'un créneau
// ─────────────────────────────────────────────────────────────────────────────
//
// Un créneau est valide ssi début < fin (contrainte DB `check_schedule_time_order`).
// Convention d'intervalle : demi-ouvert `[start, end)` (tstzrange '[)').

export function isValidTimeOrder(
  start: Date | string,
  end: Date | string,
): boolean {
  return new Date(start).getTime() < new Date(end).getTime();
}
