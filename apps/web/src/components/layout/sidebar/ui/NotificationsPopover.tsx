"use client";

import { BellIcon, AlertCircle, Calendar, BookOpen, Clock, MessageSquare, Bell } from "lucide-react";
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
import { NotificationType } from "@/generated/prisma/browser";
import { Loader1 } from "@/components/loaders/Loader";
import { getUnreadBadgeInfo } from "@/components/notification/utils";

// Fonction pour obtenir l'icône selon le type de notification
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.ABSENCE:
      return <AlertCircle className="h-5 w-5" />;
    case NotificationType.COURSE_CHANGE:
      return <Calendar className="h-5 w-5" />;
    case NotificationType.NEW_COURSE:
      return <BookOpen className="h-5 w-5" />;
    case NotificationType.SCHEDULE_UPDATE:
      return <Clock className="h-5 w-5" />;
    case NotificationType.MESSAGE:
      return <MessageSquare className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

// Fonction pour ranger le type de notification dans une des 3 catégories de la card stack
function getNotificationCategory(type: NotificationType): NotificationCategory {
  switch (type) {
    case NotificationType.ABSENCE:
      return "URGENT";
    case NotificationType.COURSE_CHANGE:
    case NotificationType.NEW_COURSE:
    case NotificationType.SCHEDULE_UPDATE:
      return "ACADEMIQUE";
    case NotificationType.MESSAGE:
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
      title: notification.type,
      description: notification.message,
      icon: getNotificationIcon(notification.type),
      unread: !notification.read,
      category: getNotificationCategory(notification.type),
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
              className="absolute left-full top-0 size-5 -translate-x-1/2 -translate-y-1/2 shrink-0 rounded-full border-2 px-1 text-auto text-[10px]"
            >
              {badge.label}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 min-h-[220px] bg-background/50 border-1 border-border/50 p-2">
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