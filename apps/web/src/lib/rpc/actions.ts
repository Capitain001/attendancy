// apps/web/src/lib/rpc/actions.ts
import {
  getSchedulesAction,
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
  getTeacherDailyScheduleAction,
  getTeacherNextScheduleAction,
} from "@/services/schedule";
import { getClassesAction } from "@/services/class";
import { registerDeviceAction, endSessionAction } from "@/services/device";
import {
  getCurrentUserAction,
  signupPersonalDesktopAction,
} from "@/services/auth";
import {
  getNotifications,
  getUnread,
  getUnreadCount,
  markNotificationAsRead,
  markAllRead,
  deleteNotification,
} from "@/services/notification";
import {
  startSessionAction,
  completeSessionAction,
  generateTokenAction,
} from "@/services/session";
import {
  getScheduleAttendancesAction,
  confirmAttendanceAction,
  confirmAllAttendancesAction,
} from "@/services/attendance";

// les server action sont réexportées côté frontend sous une couche d'API,
// on conserve le même typage et la même syntaxe bien que le moteur fasse un appel réseau
// ce qui facilite la réutilisation des composants et hooks partagés.

export const ACTIONS = {
  getSchedulesAction,
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
  getTeacherDailyScheduleAction,
  getTeacherNextScheduleAction,
  getClassesAction,
  registerDeviceAction,
  endSessionAction,
  getCurrentUserAction,
  signupPersonalDesktopAction,
  getNotifications,
  getUnread,
  getUnreadCount,
  markNotificationAsRead,
  markAllRead,
  deleteNotification,
  startSessionAction,
  completeSessionAction,
  generateTokenAction,
  getScheduleAttendancesAction,
  confirmAttendanceAction,
  confirmAllAttendancesAction,
} as const;
