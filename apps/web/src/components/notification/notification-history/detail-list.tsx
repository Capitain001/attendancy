// components/notification/notification-history/detail-list.tsx
"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { NotificationType } from "@/generated/prisma/browser";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TYPE_CONFIG, formatRelative } from "./config";

interface NotificationDetailHeaderProps {
  label: string;
  count: number;
  onBack: () => void;
}

export function NotificationDetailHeader({ label, count, onBack }: NotificationDetailHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full"
        onClick={onBack}
        aria-label="Retour"
      >
        <ArrowLeft className="size-4" />
      </Button>
      <p className="flex-1 truncate text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label} · {count}
      </p>
      <div className="size-8 shrink-0" aria-hidden />
    </div>
  );
}

// Contrairement à NotificationTypeIcon (Vue 1, neutre), cette icône porte le
// statut lu/non-lu de l'item : c'est elle qui remplace la pastille.
function NotificationItemIcon({ icon: Icon, unread }: { icon: LucideIcon; unread: boolean }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl",
        unread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </div>
  );
}

interface NotificationItemData {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationItemProps {
  notification: NotificationItemData;
  icon: LucideIcon;
  onOpen: () => void;
}

export function NotificationItem({ notification, icon, onOpen }: NotificationItemProps) {
  const unread = !notification.read;
  // Un item déjà lu s'affiche entier d'emblée ; un item non lu reste replié
  // tant que l'utilisateur ne l'a pas ouvert.
  const [expanded, setExpanded] = useState(!unread);

  const handleClick = () => {
    if (!expanded) setExpanded(true);
    onOpen();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/50"
    >
      <NotificationItemIcon icon={icon} unread={unread} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p
          className={cn(
            "text-[13px] leading-relaxed text-foreground",
            !expanded && "line-clamp-2"
          )}
        >
          {notification.message}
        </p>
        <p className="text-[11px] text-muted-foreground">{formatRelative(notification.createdAt)}</p>
      </div>
    </button>
  );
}

interface NotificationDetailListProps {
  type: NotificationType;
  items: NotificationItemData[];
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationDetailList({
  type,
  items,
  onBack,
  onMarkAsRead,
}: NotificationDetailListProps) {
  const { label, icon } = TYPE_CONFIG[type];

  return (
    <div className="space-y-4">
      <NotificationDetailHeader label={label} count={items.length} onBack={onBack} />
      <div className="space-y-0.5">
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            icon={icon}
            onOpen={() => !notification.read && onMarkAsRead(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}