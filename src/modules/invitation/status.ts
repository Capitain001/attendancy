// src/services/invitation/status.ts
/**
 * Utilitaires pour la gestion des statuts d'invitation
 * 
 * Unifie la logique de détermination des statuts entre les composants UI
 * et les services backend.
 */

import { InvitationListItem } from "./database";

export type InvitationStatus = "pending" | "accepted" | "expired";

/**
 * Détermine le statut d'une invitation basé sur ses propriétés
 * 
 * Logique :
 * - "accepted" : si usedAt est défini (invitation utilisée)
 * - "expired" : si expiresAt est défini et dans le passé, ET que usedAt n'est pas défini
 * - "pending" : dans tous les autres cas
 * 
 * @param invitation - L'invitation à évaluer
 * @returns Le statut de l'invitation
 */
export function resolveInvitationStatus(
  invitation: InvitationListItem
): InvitationStatus {
  // Si l'invitation a été utilisée, elle est acceptée
  if (invitation.usedAt) {
    return "accepted";
  }

  // Si l'invitation a une date d'expiration et qu'elle est passée, elle est expirée
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    return "expired";
  }

  // Sinon, elle est en attente
  return "pending";
}

/**
 * Retourne les informations d'affichage pour un badge de statut
 * 
 * @param status - Le statut de l'invitation
 * @returns Les informations pour l'affichage du badge
 */
export function getStatusBadgeInfo(status: InvitationStatus) {
  switch (status) {
    case "accepted":
      return {
        label: "Acceptée",
        variant: "default" as const,
        description: "Compte activé",
      };
    case "expired":
      return {
        label: "Expirée",
        variant: "destructive" as const,
        description: "À renvoyer",
      };
    default:
      return {
        label: "En attente",
        variant: "secondary" as const,
        description: "En cours de validation",
      };
  }
}

/**
 * Filtre une liste d'invitations par statut
 * 
 * @param invitations - Liste des invitations à filtrer
 * @param status - Statut à filtrer (ou "all" pour toutes)
 * @returns Liste filtrée des invitations
 */
export function filterInvitationsByStatus(
  invitations: InvitationListItem[],
  status: "all" | InvitationStatus
): InvitationListItem[] {
  if (status === "all") {
    return invitations;
  }

  return invitations.filter(
    (invitation) => resolveInvitationStatus(invitation) === status
  );
}

/**
 * Calcule les statistiques d'invitations à partir d'une liste
 * 
 * @param invitations - Liste des invitations
 * @returns Statistiques calculées
 */
export function calculateInvitationStats(invitations: InvitationListItem[]) {
  const now = new Date();
  
  let pending = 0;
  let expired = 0;
  let accepted = 0;

  invitations.forEach((invitation) => {
    const status = resolveInvitationStatus(invitation);
    
    switch (status) {
      case "accepted":
        accepted++;
        break;
      case "expired":
        expired++;
        break;
      case "pending":
        pending++;
        break;
    }
  });

  return {
    total: invitations.length,
    pending,
    expired,
    accepted,
  };
}

