// src/components/notification/notification-history/config.ts
// components/notification/notification-history/config.ts
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Calendar,
  Megaphone,
  MessageSquare,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Resource } from "@/generated/prisma/browser";

// Un seul traitement visuel (icône + libellé) par type — pas de couleur dédiée,
// le ton est porté par NotificationTypeIcon de façon uniforme.
export const TYPE_CONFIG: Partial<Record<Resource, { label: string; icon: LucideIcon }>> & Record<string, { label: string; icon: LucideIcon }> = {
  ATTENDANCE: { label: "Absences & Présences", icon: AlertTriangle },
  COURSE: { label: "Cours", icon: RefreshCw },
  SCHEDULE: { label: "Séances & Planning", icon: Calendar },
  MESSAGE: { label: "Messages", icon: MessageSquare },
  INVITATION: { label: "Invitations", icon: UserPlus },
  GENERAL: { label: "Annonces générales", icon: Megaphone },
};

export function formatRelative(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}
