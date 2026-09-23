// components/notification/notification-history/type-list.tsx
"use client";

import type { LucideIcon } from "lucide-react";
import type { NotificationType } from "@/generated/prisma/browser";
import { TYPE_CONFIG, formatRelative } from "./config";

export function NotificationTypeIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Icon className="size-4" strokeWidth={1.75} />
    </div>
  );
}

export interface NotificationGroup {
  type: NotificationType;
  unreadCount: number;
  /** Date de la dernière notification non lue du type, ou de la dernière tout court s'il n'y en a aucune. */
  lastActivityAt: Date;
}

interface NotificationTypeRowProps {
  type: NotificationType;
  unreadCount: number;
  lastActivityAt: Date;
  onSelect: () => void;
}

export function NotificationTypeRow({
  type,
  unreadCount,
  lastActivityAt,
  onSelect,
}: NotificationTypeRowProps) {
  const { label, icon } = TYPE_CONFIG[type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted"
    >
      <NotificationTypeIcon icon={icon} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13.5px] font-medium text-foreground">{label}</p>
          {unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10.5px] font-semibold tabular-nums text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-muted-foreground">{formatRelative(lastActivityAt)}</p>
      </div>
    </button>
  );
}

interface NotificationTypeListProps {
  groups: NotificationGroup[];
  onSelectType: (type: NotificationType) => void;
}

export function NotificationTypeList({ groups, onSelectType }: NotificationTypeListProps) {
  return (
    <div className="space-y-0.5">
      <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Notifications
      </p>
      {groups.map((group) => (
        <NotificationTypeRow
          key={group.type}
          type={group.type}
          unreadCount={group.unreadCount}
          lastActivityAt={group.lastActivityAt}
          onSelect={() => onSelectType(group.type)}
        />
      ))}
    </div>
  );
}