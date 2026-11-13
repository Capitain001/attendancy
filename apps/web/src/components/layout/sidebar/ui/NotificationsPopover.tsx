// src/components/layout/sidebar/ui/NotificationsPopover.tsx
//apps\web\src\components\layout\sidebar\ui\NotificationsPopover.tsx
"use client";

import { BellIcon, AlertCircle, Calendar, BookOpen, Clock, MessageSquare, Bell, Mail } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/notification/useNotification";

import { NotificationCardStack, NotificationCardData, NotificationCategory } from "@/components/notification/cardstack";
import type { Resource } from "@/generated/prisma/browser";
import { Loader1 } from "@/components/loaders/Loader";
import { getUnreadBadgeInfo } from "@/components/notification/utils";

// Fonction pour obtenir l'icône selon le type de notification
function getNotificationIcon(resourceType: Resource | null | undefined) {
  switch (resourceType) {
    case "ATTENDANCE":
      return <AlertCircle className="h-5 w-5" />;
    case "SCHEDULE":
      return <Calendar className="h-5 w-5" />;
    case "COURSE":
      return <BookOpen className="h-5 w-5" />;
    case "INVITATION":
      return <Mail className="h-5 w-5" />;
    case "MESSAGE":
      return <MessageSquare className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

// Fonction pour ranger le type de notification dans une des 3 catégories de la card stack
function getNotificationCategory(resourceType: Resource | null | undefined): NotificationCategory {
  switch (resourceType) {
    case "ATTENDANCE":
      return "URGENT";
    case "SCHEDULE":
    case "COURSE":
    case "INVITATION":
      return "ACADEMIQUE";
    case "MESSAGE":
      return "PERSONNEL";
    default:
      return "PERSONNEL";
  }
}

// NotificationsCardStack
export function NotificationsPopover() {
  const { notifications, unread, isLoading, actions } = useNotifications();

  // Transformer les notifications de la base de données en NotificationCardData
  const cardData: NotificationCardData[] = useMemo(() => {
    return notifications.slice(0, 4).map((notification) => ({
      id: notification.id,
      title: notification.resourceType ?? "Notification",
      description: notification.message,
      icon: getNotificationIcon(notification.resourceType),
      unread: !notification.read,
      category: getNotificationCategory(notification.resourceType),
    }));
  }, [notifications]);

  const unreadCount = unread.length;
  const badge = getUnreadBadgeInfo(unreadCount);

  const handleNotificationClick = async (card: NotificationCardData) => {
    // Marquer la notification comme lue si elle ne l'est pas déjà
    if (card.unread) {
      await actions.markAsRead(card.id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Open notifications"
          className="relative rounded-full"
          size="icon"
          variant="outline"
        >
          <BellIcon aria-hidden="true" size={16} />
          {unreadCount > 0 && (
            <Badge
              variant={badge.variant}
              className="absolute left-full top-0 size-5 -translate-x-1/2 -translate-y-1/2 shrink-0 p-0 inline-flex items-center justify-center leading-none rounded-full border-2 text-[10px] bg-[var(--destructive)] hover:bg-[var(--destructive)]/80 text-[var(--destructive-foreground)] select-none"
            >
              {badge.label}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={0}
        className="w-screen sm:w-[400px] min-h-[220px] bg-background/50 backdrop-blur-md border border-border/50 p-2"
      >
        {isLoading ? (
          <div className="flex flex-col  items-center justify-center py-8">
            <Loader1 />
            <p className="text-sm text-muted-foreground">Chargement des notifications...</p>

          </div>
        ) : cardData.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <NotificationCardStack
            cards={cardData}
            onCardClick={handleNotificationClick}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
