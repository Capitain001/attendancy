// src/modules/invitation/policy.ts

import type { Invitation, InvitationStatus  } from "@/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DBInvitation = Pick<Invitation, "status" | "expiresAt">;

/*
 * Cycle de vie d'une Invitation
 * ─────────────────────────────────────────────────────────────
 * status DB : PENDING ──┬──→ ACCEPTED   (acté — l'invité a accepté)
 *                        ├──→ DECLINED   (acté — l'invité a refusé)
 *                        └──→ REVOKED    (acté — l'invitant a retiré l'invitation)
 *
 * PENDING est la racine neutre : aucune des trois issues n'a encore été
 * actée. Il ne préjuge PAS de l'échéance — il reste vrai après expiresAt
 * tant que personne n'a tranché.
 *
 * Règle de l'enum : il ne contient QUE des états issus d'un événement
 * (une décision humaine). Ce qui découle du temps est déduit, jamais stocké.
 *
 * EXPIRED n'existe QU'en UI, jamais en DB :
 *   - C'est un fait purement temporel (expiresAt <= now), pas une décision.
 *     Aucun événement ne le déclenche : le persister demanderait un job
 *     pour écrire une information déjà calculable, et créerait une seconde
 *     source de vérité qui pourrait diverger de expiresAt.
 *
 * REVOKED, lui, est persisté : c'est une transition du cycle de vie (possible
 * uniquement depuis PENDING), pas un deletedAt. Il n'est pas orthogonal à
 * l'état : une invitation ACCEPTED ou DECLINED ne peut pas être révoquée.
 *
 * Champs temporels :
 *   - expiresAt  : échéance (donnée d'entrée), PAS un état
 *   - usedAt     : date de sortie de PENDING, commune aux trois issues
 *                  (invariant DB : status = PENDING ⇔ usedAt IS NULL)
 *
 * Sécurité : un token n'est utilisable que si status = PENDING ET
 * expiresAt non dépassé. Toute requête qui consomme un token doit porter
 * ces deux conditions ; le statut UI ne remplace jamais ce contrôle.
 *
 * timeline :  [createdAt] ─────────────── [expiresAt]
 * phase    :   pending (selon now)         → après expiresAt : expired (si toujours PENDING)
 *              ACCEPTED / DECLINED / REVOKED : acté, fige l'état à tout moment
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Statuts DB + EXPIRED (dérivé du temps, jamais en DB).
 * Un nouveau statut ajouté à l'enum Prisma apparaît automatiquement ici.
 */
export type InvitationUiStatus = InvitationStatus | "EXPIRED";
  // "EXPIRED"   // status DB = PENDING avec expiresAt <= now — dérivé, jamais en DB

/**
 * Libellés canoniques des statuts UI (féminin — « l'invitation »).
 * Source unique : toute surface (listes, badges) importe ceci au lieu de
 * redéfinir ses propres labels. Le style (couleur/dot) reste propre à chaque UI.
 */
export const INVITATION_UI_STATUS_LABEL: Record<InvitationUiStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  DECLINED: "Refusée",
  REVOKED: "Révoquée",
  EXPIRED: "Expirée",
}

// ─── Fonction pure ────────────────────────────────────────────────────────────

/**
 * Dérive le statut affichable d'une Invitation depuis son status DB + le temps.
 * Logique pure — testable sans React, sans accès DB.
 *
 * Priorité : les statuts DB déjà actés (ACCEPTED/DECLINED/REVOKED)
 * sont des faits décisionnels — ils priment toujours sur le calcul temporel.
 * Une invitation acceptée avant son échéance ne devient jamais « expirée ».
 * Seul PENDING est réévalué contre (expiresAt, now).
 */
export function resolveInvitationUiStatus(
  invitation: DBInvitation,
  now: Date,
) {
  // ── Statuts déjà actés : priorité absolue, jamais recalculés ──────────────
  if (invitation.status !== "PENDING") {
    return invitation.status;
  }

  // ── PENDING : à réévaluer contre l'échéance ───────────────────────────────
  // expiresAt nul = pas d'échéance, l'invitation reste valable jusqu'à décision.
  if (invitation.expiresAt && invitation.expiresAt < now) {
    return "EXPIRED";
  }

  return "PENDING";
}