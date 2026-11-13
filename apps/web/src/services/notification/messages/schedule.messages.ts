//apps\web\src\services\notification\messages\schedule.messages.ts
import type { NotificationEvent } from "@/generated/prisma/browser";


export function getTeacherScheduleMessage(
  event: NotificationEvent,
  courseName: string,
  day: string,
): string {
  if (event === "CREATED" || event === "ASSIGNED") {
    return `Vous êtes affecté au cours ${courseName} le ${day}.`;
  }
  if (event === "CANCELED") {
    return `Le cours ${courseName} du ${day} est annulé.`;
  }
  return `Le cours ${courseName} du ${day} a été modifié.`;
}

export function getTeacherUnassignedMessage(
  courseName: string,
  day: string,
): string {
  return `Le cours ${courseName} du ${day} ne vous est plus assigné.`;
}

export function getStudentsScheduleMessage(
  event: NotificationEvent,
  courseName: string,
  day: string,
): string {
  if (event === "CANCELED") {
    return `Le cours ${courseName} du ${day} est annulé.`;
  }
  if (event === "UPDATED") {
    return `Le cours ${courseName} du ${day} a été modifié (salle, horaire ou enseignant).`;
  }
  return `Nouveau cours : ${courseName} le ${day}.`;
}
