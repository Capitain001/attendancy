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
import { NotificationType } from "@/generated/prisma/browser";

// Un seul traitement visuel (icône + libellé) par type — pas de couleur dédiée,
// le ton est porté par NotificationTypeIcon de façon uniforme.
export const TYPE_CONFIG: Record<NotificationType, { label: string; icon: LucideIcon }> = {
  ABSENCE: { label: "Absences", icon: AlertTriangle },
  COURSE_CHANGE: { label: "Changements de cours", icon: RefreshCw },
  NEW_COURSE: { label: "Nouveaux cours", icon: Calendar },
  SCHEDULE_UPDATE: { label: "Mises à jour d'horaire", icon: Calendar },
  GENERAL: { label: "Annonces générales", icon: Megaphone },
  MESSAGE: { label: "Messages", icon: MessageSquare },
  INVITATION: { label: "Invitations", icon: UserPlus },
};

export function formatRelative(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}
