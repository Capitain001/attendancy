"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Smartphone,
  CheckCheck,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Wifi,
  WifiOff,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserNotification } from "@/hooks/notification/useUserNotification";
import { useNotifications } from "@/hooks/notification/useUnreadNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.hostname;
  } catch {
    return endpoint.slice(0, 30) + "…";
  }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${ok ? "bg-green-500" : "bg-red-400"}`}
    />
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function PushSection() {
  const { state, isLoading, error, actions } = useUserNotification();

  const canSubscribe =
    state.isSupported && state.isHTTPS && state.hasVAPID && state.isGranted;
  const isSubscribed = !!state.subscription;

  const handleToggle = async () => {
    if (isSubscribed) {
      await actions.unsubscribe();
    } else if (state.isGranted) {
      await actions.subscribe();
    } else {
      const granted = await actions.requestPermission();
      if (granted) await actions.subscribe();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {isSubscribed ? (
              <BellRing className="size-5 text-primary" />
            ) : (
              <BellOff className="size-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold">
              Notifications push navigateur
            </h4>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? "Activées — vous recevez les alertes en temps réel"
                : "Désactivées — aucune alerte en dehors de l'application"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => actions.sendNotification("🔔 Notification de test — tout fonctionne !")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <BellRing className="size-3" />
              )}
              Tester
            </Button>
          )}
          {isLoading && !isSubscribed ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={!state.isSupported || !state.isHTTPS || !state.hasVAPID || isLoading}
            />
          )}
        </div>
      </div>

      {/* Prérequis */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 text-xs">
          <StatusDot ok={state.isSupported} />
          <span>Navigateur compatible</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 text-xs">
          <StatusDot ok={state.isHTTPS} />
          <span>Connexion sécurisée (HTTPS)</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30 text-xs">
          <StatusDot ok={state.permission === "granted"} />
          <span>
            Permission :{" "}
            <span className="font-medium">
              {state.permission === "granted"
                ? "accordée"
                : state.permission === "denied"
                  ? "refusée"
                  : "en attente"}
            </span>
          </span>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Permission bloquée */}
      {state.permission === "denied" && (
        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
          La permission a été refusée dans votre navigateur. Pour l'activer,
          rendez-vous dans les paramètres de votre navigateur.
        </p>
      )}

      {/* Appareils abonnés */}
      {state.subscriptions && state.subscriptions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Appareils abonnés ({state.subscriptions.length})
            </h5>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={actions.refreshSubscriptions}
            >
              <RefreshCw className="size-3" />
              Actualiser
            </Button>
          </div>
          {state.subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">
                    {sub.userAgent
                      ? sub.userAgent.split(" ").slice(0, 3).join(" ")
                      : "Appareil inconnu"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {shortEndpoint(sub.endpoint)} &middot;{" "}
                    {formatDistanceToNow(new Date(sub.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => actions.unsubscribeDevice(sub.endpoint)}
                disabled={isLoading}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InAppSection() {
  const { notifications, unread, isLoading, actions } = useNotifications();
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Notifications in-app</h4>
          <p className="text-xs text-muted-foreground">
            {unread.length > 0
              ? `${unread.length} non lue${unread.length > 1 ? "s" : ""}`
              : "Tout est lu"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => actions.refresh()}
            disabled={isLoading}
          >
            <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          {unread.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => actions.markAllRead()}
              disabled={actions.isMarkingAllRead}
            >
              {actions.isMarkingAllRead ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3" />
              )}
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
          <Bell className="size-8 opacity-30" />
          <p className="text-sm">Aucune notification</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {displayed.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                  !notif.read
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card/60"
                }`}
              >
                <div
                  className={`mt-0.5 size-2 shrink-0 rounded-full ${!notif.read ? "bg-primary" : "bg-transparent"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground"
                    onClick={() => actions.markAsRead(notif.id)}
                    disabled={actions.isMarkingAsRead}
                  >
                    <CheckCheck className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {notifications.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? "Voir moins"
                : `Voir ${notifications.length - 5} de plus`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">
          Notifications
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Gérez vos abonnements push et consultez l'historique de vos alertes.
        </p>
      </div>

      {/* Push */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Alertes push
        </h4>
        <PushSection />
      </section>

      <div className="border-t border-border" />

      {/* In-app */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Historique
        </h4>
        <InAppSection />
      </section>
    </div>
  );
}
