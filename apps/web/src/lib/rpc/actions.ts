// apps/web/src/lib/rpc/actions.ts
import {
  getSchedulesAction,
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
} from "@/services/schedule";
import { getClassesAction } from "@/services/class";
import { registerDeviceAction, endSessionAction } from "@/services/device";
import {
  getCurrentUserAction,
  signupPersonalDesktopAction,
} from "@/services/auth";

export const ACTIONS = {
  getSchedulesAction,
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
  getClassesAction,
  registerDeviceAction,
  endSessionAction,
  getCurrentUserAction,
  signupPersonalDesktopAction,
} as const;
