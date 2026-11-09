import type { InvitationUiStatus } from "./policy";

export type InvitationBadgeVariant = "default" | "destructive" | "secondary";

export const INVITATION_BADGE_CLASSES: Record<InvitationBadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  secondary: "bg-muted text-muted-foreground",
};

interface InvitationStatusBadgeInfo {
  label: string;
  variant: InvitationBadgeVariant;
  description: string;
}

const INVITATION_STATUS_BADGE_INFO: Record<
  InvitationUiStatus,
  InvitationStatusBadgeInfo
> = {
  PENDING: {
    label: "En attente",
    variant: "secondary",
    description: "En cours de validation",
  },
  ACCEPTED: {
    label: "Acceptée",
    variant: "default",
    description: "Compte activé",
  },
  EXPIRED: {
    label: "Expirée",
    variant: "destructive",
    description: "À renvoyer",
  },
  DECLINED: {
    label: "Refusée",
    variant: "destructive",
    description: "Le destinataire a refusé l'invitation",
  },
  REVOKED: {
    label: "Révoquée",
    variant: "secondary",
    description: "L'invitation a été révoquée",
  },
};

export function getStatusBadgeInfo(status: InvitationUiStatus) {
  return INVITATION_STATUS_BADGE_INFO[status];
}
