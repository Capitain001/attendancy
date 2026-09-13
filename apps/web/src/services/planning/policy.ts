// src/services/planning/policy.ts
//
// Règles métier PURES du domaine Planning (testables sans React, partagées
// client ⇄ serveur). Source de vérité unique : les gardes UI (UX) et
// l'enforcement serveur (mutations schedule) consomment ces mêmes fonctions.
//
// Certaines règles sont *aussi* appliquées en base (contraintes/triggers Postgres,
// cf. prisma/migrations/20260511220000_schedule_constraints) — la DB reste l'autorité ;
// ces helpers servent à anticiper/expliquer côté code sans réinventer la logique.
//
// Voir aussi : doc/PLANNING_CONTEXT.md, src/services/planning/CLAUDE.md.
// Ce fichier grandit au fil des règles rencontrées — pas d'inventaire exhaustif ici.

import type { ScheduleStatus } from "@/generated/prisma/client";

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

/** Message utilisateur partagé (actions serveur). */
export const INVALID_TIME_ORDER_ERROR =
  "L'heure de fin doit être après l'heure de début.";

export function isValidTimeOrder(
  start: Date | string,
  end: Date | string,
): boolean {
  return new Date(start).getTime() < new Date(end).getTime();
}

// ─────────────────────────────────────────────────────────────────────────────
// R3 — Statuts ignorés pour les conflits / la disponibilité
// ─────────────────────────────────────────────────────────────────────────────
//
// Un créneau CANCELED ou MISSED ne « réserve » plus ses ressources : il est
// exclu des checks d'overlap (cf. clauses WHERE des contraintes d'exclusion DB et
// des requêtes availability/conflicts). Soft-delete (deletedAt) également ignoré.

export const CONFLICT_IGNORED_STATUSES = [
  "CANCELED",
  "MISSED",
] as const satisfies readonly ScheduleStatus[];

/** Vrai si ce créneau réserve ses ressources (donc compte dans les conflits). */
export function reservesResources(status: ScheduleStatus): boolean {
  return !(CONFLICT_IGNORED_STATUSES as readonly ScheduleStatus[]).includes(status);
}

// ─────────────────────────────────────────────────────────────────────────────
// R4 — Exclusivité des ressources (chevauchement)
// ─────────────────────────────────────────────────────────────────────────────
//
// Sur un même créneau qui se chevauche (même org, statut réservant, non supprimé) :
//   ROOM    → 1 salle    = 1 séance à la fois   (bloquant)
//   TEACHER → 1 prof     = 1 séance à la fois   (bloquant)
//   CLASS   → 1 séance « globale » (groupId NULL) par classe à la fois (bloquant)
//   GROUP   → 1 séance par groupe à la fois      (bloquant)
//   COURSE  → NON bloquant (un même cours peut tourner en parallèle sur des groupes)
//
// Granularité classe/groupe :
//   • Classe entière + autre séance simultanée            → ❌ interdit
//   • Groupe A + Groupe B (même classe) simultanés        → ✅ autorisé (salles/profs ≠)
//   • Groupe A + 2 séances simultanées                    → ❌ interdit
// Autorité : contraintes d'exclusion GiST (no_room/teacher/class/group_overlap).

export type PlanningResourceKind =
  | "ROOM"
  | "TEACHER"
  | "CLASS"
  | "GROUP"
  | "COURSE";

export const BLOCKING_RESOURCES = [
  "ROOM",
  "TEACHER",
  "CLASS",
  "GROUP",
] as const satisfies readonly PlanningResourceKind[];

/** Une ressource bloquante n'admet qu'une séance par créneau chevauchant. */
export function isBlockingResource(kind: PlanningResourceKind): boolean {
  return (BLOCKING_RESOURCES as readonly PlanningResourceKind[]).includes(kind);
}

// ─────────────────────────────────────────────────────────────────────────────
// R5 — Verrou métier : un Schedule n'est modifiable que tant qu'il est PENDING
// ─────────────────────────────────────────────────────────────────────────────
//
// Dès qu'une séance quitte PENDING (COMPLETED/CANCELED/MISSED), ses champs
// structurants (cours/prof/salle/classe/groupe/horaires) sont figés
// (trigger DB `prevent_locked_schedule_update`). Permet d'anticiper côté UI/serveur.
// ONGOING n'existe plus en DB : « en cours » est dérivé du temps (UI-only).

export function isScheduleMutable(status: ScheduleStatus): boolean {
  return status === "PENDING";
}

// ─────────────────────────────────────────────────────────────────────────────
// R6 — Verrou explicite (isLocked) + créneau écoulé : figent aussi les champs
// structurants, indépendamment du status
// ─────────────────────────────────────────────────────────────────────────────
//
// Deux niveaux de verrou sur les champs STRUCTURANTS (cours/prof/salle/classe/
// groupe/horaires) — `notes` n'entre JAMAIS dans ce calcul, toujours éditable
// quel que soit status/isLocked/temps (action dédiée séparée) :
//
//   1. isScheduleLocked   → status ≠ PENDING OU isLocked = true
//                           Autorité : trigger DB `prevent_locked_schedule_update`
//                           (RAISE EXCEPTION dans les deux cas). Fiable à 100%,
//                           la DB rejettera toute tentative de contournement.
//
//   2. isScheduleEditable → en plus, le créneau ne doit pas être
//                           déjà écoulu (PENDING + isLocked=false + passé → figé).
//                           PAS (encore) appliqué en DB — le seuil temporel
//                           (latence transaction / horloge) n'est pas assez
//                           tranché pour un RAISE EXCEPTION en dur ; ce contrôle
//                           reste applicatif/UI pour l'instant (cf. R1/isSlotElapsed),
//                           à faire remonter en DB si le besoin se confirme.

export const LOCKED_SCHEDULE_ERROR = "Séance verrouillée : modification impossible.";

export type ScheduleLockInput = {
  status: ScheduleStatus;
  isLocked: boolean;
};

/** Verrou figé côté DB (authoritative) : status non-PENDING OU isLocked. */
export function isScheduleLocked(schedule: ScheduleLockInput): boolean {
  return !isScheduleMutable(schedule.status) || schedule.isLocked;
}

export type ScheduleStructuralEditInput = ScheduleLockInput & {
  start: Date | string;
  end?: Date | string | null;
};

/**
 * Éditabilité complète des champs structurants (DB + règle applicative du
 * créneau écoulé). C'est CETTE fonction qui doit piloter la désactivation
 * du bouton d'édition en UI — `isScheduleMutable` seul ne suffit plus.
 */
export function isScheduleEditable(schedule: ScheduleStructuralEditInput): boolean {
  if (isScheduleLocked(schedule)) return false;
  if (isSlotElapsed({ start: schedule.start, end: schedule.end })) return false;
  return true;
}