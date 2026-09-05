// services/persmission/types.ts

import { Action, Resource } from "@/generated/prisma/client";

/**
 * Labels pour affichage humain
 */
export const ActionLabels: Record<Action, string> = {
  CREATE: "Create",
  READ: "View",
  UPDATE: "Update",
  DELETE: "Delete",
  CRUD: "CRUD",
};

export const ResourceLabels: Record<Resource, string> = {
  COURSE: "course",
  SCHEDULE: "schedule",
  USER: "user",
  TEACHER: "teacher",
  ROOM: "room",
  LOCATION: "location",
  CLASS: "class",
  STUDENT: "student",
  ATTENDANCE: "attendance",
  GRADE: "grade",
  PROGRAM: "program",
  FILIERE: "filiere",
  MESSAGE: "message",
  JUSTIFICATION: "justification",
};

/**
 * Format typé de nom de permission
 * - Global : Action:Resource
 * - Spécifique : Action:Resource:ResourceName
 */
export type PermissionName =
  | `${Action}:${Resource}`
  | `${Action}:${Resource}:${string}`;
