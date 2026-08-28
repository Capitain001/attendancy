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
} from "lucide-react";
import { NotificationType } from "@/generated/prisma/browser";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/notification/useNotification";
import { usePushNotifications } from "@/hooks/notification/usePushNotifications";
import {
  BellQuietIllustration,
  StudentEmpty,
} from "@/components/student/ui/illustrations";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  NotificationType,
  { icon: React.ReactNode; className: string }
> = {
  SCHEDULE_UPDATE: { icon: <Clock className="size-4" />, className: "bg-violet-500/15 text-violet-600" },
  COURSE_CHANGE: { icon: <Calendar className="size-4" />, className: "bg-violet-500/15 text-violet-600" },
  ABSENCE: { icon: <AlertCircle className="size-4" />, className: "bg-amber-500/15 text-amber-600" },
  NEW_COURSE: { icon: <BookOpen className="size-4" />, className: "bg-sky-500/15 text-sky-600" },
  MESSAGE: { icon: <MessageSquare className="size-4" />, className: "bg-muted text-muted-foreground" },
  INVITATION: { icon: <Bell className="size-4" />, className: "bg-muted text-muted-foreground" },
  GENERAL: { icon: <Bell className="size-4" />, className: "bg-muted text-muted-foreground" },
};

/** Toggle push avec micro-bénéfice explicite (P-26). */
function PushToggle() {
  const { state, isLoading, actions } = usePushNotifications();
  const enabled = state.isGranted && !!state.subscription;

  async function handleToggle(checked: boolean) {
    if (checked) {
      const granted = state.isGranted || (await actions.requestPermission());
      if (granted) await actions.subscribe();
    } else {
      await actions.unsubscribe();
    }
  }

  if (!state.isSupported) return null;

  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">Alertes sur ton téléphone</p>
        <p className="text-xs text-muted-foreground">
          Sois prévenu si un cours change de salle, d&apos;horaire ou est annulé.
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        aria-label="Activer les notifications push"
      />
    </section>
  );
}

/** Page notifications étudiant (D16) — liste + marquer lu + toggle push. */
export function NotificationsView() {
  const { notifications, unread, isLoading, actions } = useNotifications();

  return (
    <div className="flex flex-col gap-4">
      <PushToggle />

      <div className="flex items-center justify-between">
        <p className="font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {unread.length > 0
            ? `${unread.length} non lue${unread.length > 1 ? "s" : ""}`
            : "Tout est lu"}
        </p>
        {unread.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            disabled={actions.isMarkingAllRead}
            onClick={() => actions.markAllRead()}
          >
            <CheckCheck className="size-3.5" />
            Tout marquer lu
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <StudentEmpty
          illustration={<BellQuietIllustration />}
          title="Rien à signaler"
          hint="Tu seras prévenu ici si ton planning change ou si une absence est enregistrée."
        />
      ) : (
        <ul className="space-y-1.5 animate-in fade-in duration-300">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.GENERAL;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => !n.read && actions.markAsRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg p-4 text-left transition-colors",
                    n.read ? "bg-muted/30 opacity-60" : "bg-muted/50 hover:bg-accent/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                      meta.className,
                    )}
                  >
                    {meta.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </span>
                  {!n.read && (
                    <span aria-label="Non lue" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
