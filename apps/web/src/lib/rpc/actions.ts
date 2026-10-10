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

//les server action sont rexporter coter frontend sous une couche d api , on conserve le meme typage et la meme syntaxe bien que le moteur fasse un appelle reseau ce qui facilite la reutilisation des UI server component 


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
