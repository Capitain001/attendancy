"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  Clock,
  MessageSquare,
  Users,
} from "lucide-react";
import { NotificationType } from "@/generated/prisma/browser";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminNotifications } from "@/hooks/notification/useAdminNotifications";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  NotificationType,
  { icon: React.ReactNode; label: string; className: string }
> = {
  SCHEDULE_UPDATE: {
    icon: <Clock className="size-4" />,
    label: "Mise à jour planning",
    className: "bg-violet-500/15 text-violet-600",
  },
  COURSE_CHANGE: {
    icon: <Calendar className="size-4" />,
    label: "Changement de cours",
    className: "bg-violet-500/15 text-violet-600",
  },
  ABSENCE: {
    icon: <AlertCircle className="size-4" />,
    label: "Absence",
    className: "bg-amber-500/15 text-amber-600",
  },
  NEW_COURSE: {
    icon: <BookOpen className="size-4" />,
    label: "Nouveau cours",
    className: "bg-sky-500/15 text-sky-600",
  },
  MESSAGE: {
    icon: <MessageSquare className="size-4" />,
    label: "Message",
    className: "bg-muted text-muted-foreground",
  },
  INVITATION: {
    icon: <Users className="size-4" />,
    label: "Invitation",
    className: "bg-emerald-500/15 text-emerald-600",
  },
  GENERAL: {
    icon: <Bell className="size-4" />,
    label: "Général",
    className: "bg-muted text-muted-foreground",
  },
};

/**
 * Vue des notifications côté Direction.
 * Affiche toutes les notifications de l'organisation (lecture seule).
 */
export function DirectionNotificationsView() {
  const { notifications, unread, isLoading, actions } = useAdminNotifications();

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de titre + action globale */}
      <div className="flex items-center justify-between">
        <p className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {unread.length > 0
            ? `${unread.length} non lue${unread.length > 1 ? "s" : ""}`
            : "Tout est lu"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => actions.refresh()}
        >
          <CheckCheck className="size-3.5" />
          Actualiser
        </Button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <Bell className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Aucune notification pour l&apos;organisation.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5 animate-in fade-in duration-300">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.GENERAL;
            return (
              <li key={n.id}>
                <div
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg p-4 text-left",
                    n.read ? "bg-muted/30 opacity-60" : "bg-muted/50",
                  )}
                >
                  {/* Icône type */}
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                      meta.className,
                    )}
                  >
                    {meta.icon}
                  </span>

                  {/* Contenu */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{n.message}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{meta.label}</span>
                    </span>
                  </span>

                  {/* Indicateur non lu */}
                  {!n.read && (
                    <span
                      aria-label="Non lue"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
