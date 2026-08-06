// src/services/schedule/policy.ts

import type { Schedule } from "@/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DBSchedule = Pick<Schedule, "status" | "startTime" | "endTime">;

/*
 * Cycle de vie d'un Schedule
 * ─────────────────────────────────────────────────────────────
 * status DB : PENDING ──┬──→ COMPLETED   (acté — séance effectuée)
 *                        ├──→ CANCELED    (acté — séance annulée)
 *                        └──→ MISSED      (acté par défaut — fenêtre passée, rien acté)
 *
 * PENDING est la racine neutre : aucune des trois issues n'a encore été
 * actée. Il ne préjuge PAS de la position temporelle — il reste vrai avant,
 * pendant, et juste après la fenêtre (tant que rien n'a tranché).
 *
 * ONGOING n'existe QU'en UI, jamais en DB :
 *   - C'est un fait purement temporel (startTime ≤ now < endTime), pas une
 *     décision. Le persister n'ajoute aucune information récupérable
 *     autrement, et rendrait la séance immuable pendant son propre
 *     déroulement (trigger DB prevent_locked_schedule_update bloque tout
 *     update hors status=PENDING).
 *
 * MISSED, lui, DOIT être persisté à terme — contrairement à ONGOING, ne pas
 * l'écrire forcerait status=PENDING à mentir indéfiniment sur un fait passé
 * (« encore à venir » alors que la fenêtre est révolue sans suite). Cette
 * policy ne décide PAS qui/quand l'écrit ; elle anticipe seulement la
 * lecture UI pendant la fenêtre de latence où la DB n'a pas encore tranché
 * (voir resolveScheduleUiStatus, cas PENDING + endTime < now).
 *
 * "REPORTED" est retirer de la liste des statuts DB — il n'est plus utilisé (il na  jamais ete utiliser ).
 *
 * timeline :  [startTime] ─────────────── [endTime]
 * phase    :   pending/ongoing (selon now)    → après endTime : COMPLETED / CANCELED / MISSED
 * ─────────────────────────────────────────────────────────────
 */
export type ScheduleUiStatus =
  | "PENDING"    // status DB = PENDING, now < startTime
  | "ONGOING"    // status DB = PENDING, startTime <= now < endTime — dérivé, jamais en DB
  | "COMPLETED"  // status DB = COMPLETED — acté
  | "CANCELED"   // status DB = CANCELED — acté
  | "MISSED"     // status DB = MISSED, OU status DB = PENDING avec endTime <= now (latence non encore actée)

/**
 * Libellés canoniques des statuts UI (féminin — « la séance »).
 * Source unique : toute surface (timelines, badges) importe ceci au lieu de
 * redéfinir ses propres labels. Le style (couleur/dot) reste propre à chaque UI.
 */
export const SCHEDULE_UI_STATUS_LABEL: Record<ScheduleUiStatus, string> = {
  PENDING: "À venir",
  ONGOING: "En cours",
  COMPLETED: "Terminée",
  CANCELED: "Annulée",
  MISSED: "Manquée",
}


// ─── Fonction pure ────────────────────────────────────────────────────────────

/**
 * Dérive le statut affichable d'un Schedule depuis son status DB + le temps.
 * Logique pure — testable sans React, sans accès DB.
 *
 * Priorité : les statuts DB déjà actés (COMPLETED/CANCELED/MISSED)
 * sont des faits décisionnels — ils priment toujours sur le calcul temporel.
 * Seul PENDING est réévalué contre (startTime, endTime, now).
 */
export function resolveScheduleUiStatus(
  schedule: DBSchedule,
  now: Date,
): ScheduleUiStatus {
  // ── Statuts déjà actés : priorité absolue, jamais recalculés ──────────────
  if (schedule.status !== "PENDING") {
    return schedule.status as ScheduleUiStatus;
  }

  // ── PENDING : à réévaluer contre le temps ─────────────────────────────────
  if (now < schedule.startTime) {
    return "PENDING";
  }

  if (now < schedule.endTime) {
    return "ONGOING";
  }

  // now >= endTime, status DB toujours PENDING : fenêtre de latence — la DB
  // n'a pas encore acté MISSED, mais PENDING serait un mensonge temporel ici.
  return "MISSED";
}
