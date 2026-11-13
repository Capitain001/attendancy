// src/services/notification/server.ts

export {
  createInvitationNotification,
  upsertInvitationNotification,
  setInvitationNotificationStatus,
  type NotificationPayload,
} from "./database/notification.mutations";

export {
  onScheduleEvent,
  isConfirmedSchedule,
  type ScheduleNotifyBefore,
  type ScheduleNotifyParams,
} from "./events";

export {
  sendPushNotificationToUserById,
  sendPushNotificationToUserById as sendPushNotificationById,
} from "./user";
