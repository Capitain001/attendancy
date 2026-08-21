import type { UserInfo, UserStatus } from "@/types/user";

export const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
  ON_LEAVE: "En congé",
  PENDING: "En attente",
  NEW: "Nouveau",
  INVITED: "Invité",
};

