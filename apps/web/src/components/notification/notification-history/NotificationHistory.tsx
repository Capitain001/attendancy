// components/notification/NotificationHistory.tsx
"use client";

import { useMemo, useState } from "react";
import type { NotificationType } from "@/generated/prisma/browser";
import { useNotifications } from "@/hooks/notification/useNotification";
import { NotificationDetailList } from "./detail-list";
import { NotificationEmptyState, NotificationHistorySkeleton } from "./states";
import { NotificationGroup, NotificationTypeList } from "./type-list";

interface NotificationHistoryProps {
  limit?: number;
}

export function NotificationHistory({ limit = 20 }: NotificationHistoryProps) {
  const [selectedType, setSelectedType] = useState<NotificationType | null>(null);
  const { notifications, isLoading, actions } = useNotifications({ limit });

  // Regroupement par type. On suppose `notifications` déjà triée du plus
  // récent au plus ancien (ordre renvoyé par getNotifications) : le premier
  // élément non lu d'un groupe est donc sa dernière activité non lue.
  const { byType, groups } = useMemo(() => {
    const byType = new Map<NotificationType, typeof notifications>();
    notifications.forEach((item) => {
      byType.set(item.type, [...(byType.get(item.type) ?? []), item]);
    });

    const groups: NotificationGroup[] = Array.from(byType.entries()).map(([type, items]) => {
      const unread = items.filter((n) => !n.read);
      const last = unread[0] ?? items[0];
      return { type, unreadCount: unread.length, lastActivityAt: last.createdAt };
    });

    return { byType, groups };
  }, [notifications]);

  if (isLoading) return <NotificationHistorySkeleton />;

  if (selectedType) {
    return (
      <div className="w-full px-2 py-2">
        <NotificationDetailList
          type={selectedType}
          items={byType.get(selectedType) ?? []}
          onBack={() => setSelectedType(null)}
          onMarkAsRead={actions.markAsRead}
        />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="w-full px-2 py-2">
        <NotificationEmptyState />
      </div>
    );
  }

  return (
    <div className="w-full px-2 py-2">
      <NotificationTypeList groups={groups} onSelectType={setSelectedType} />
    </div>
  );
}
