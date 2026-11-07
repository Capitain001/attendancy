import type { InvitationListItem } from "./database";
import {
  resolveInvitationUiStatus,
  type InvitationUiStatus,
} from "./policy";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked" | "declined";
const UI_STATUS: Record<InvitationUiStatus, InvitationStatus> = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  EXPIRED: "expired",
  REVOKED: "revoked",
  DECLINED: "declined",
};

export function resolveInvitationStatus(
  invitation: InvitationListItem,
  now = new Date(),
): InvitationStatus {
  return UI_STATUS[resolveInvitationUiStatus(invitation, now)];
}

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
    case "declined":
      return {
        label: "Refusée",
        variant: "destructive" as const,
        description: "Le destinataire a refusé l'invitation",
      };
    case "revoked":
      return {
        label: "Révoquée",
        variant: "secondary" as const,
        description: "L'invitation a été révoquée",
      };
    case "pending":
      return {
        label: "En attente",
        variant: "secondary" as const,
        description: "En cours de validation",
      };
  }
}

export function filterInvitationsByStatus(
  invitations: InvitationListItem[],
  status: "all" | InvitationStatus,
): InvitationListItem[] {
  if (status === "all") return invitations;

  const now = new Date();
  return invitations.filter(
    (invitation) => resolveInvitationStatus(invitation, now) === status,
  );
}

export function calculateInvitationStats(invitations: InvitationListItem[]) {
  const now = new Date();
  let pending = 0;
  let expired = 0;
  let accepted = 0;
  let revoked = 0;

  invitations.forEach((invitation) => {
    switch (resolveInvitationStatus(invitation, now)) {
      case "accepted":
        accepted++;
        break;
      case "expired":
        expired++;
        break;
      case "pending":
        pending++;
        break;
      case "declined":
      case "revoked":
        revoked++;
        break;
    }
  });

  return { total: invitations.length, pending, expired, accepted, revoked };
}
