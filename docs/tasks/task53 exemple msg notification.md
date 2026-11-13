1. Élève absent, vers les parents
typescript
// messages/attendance.messages.ts
export function getParentAbsenceMessage(
  event: NotificationEvent,
  studentName: string,
  courseName: string,
  day: string,
): string {
  if (event === "UPDATED") {
    return `La présence de ${studentName} au cours ${courseName} du ${day} a été modifiée.`;
  }
  return `${studentName} a été marqué absent au cours ${courseName} le ${day}.`;
}
typescript
const day = formatDate(schedule.startTime, "DAY_MONTH");

for (const parentUserId of parentUserIds) {
  sendPushNotificationById(parentUserId, {
    orgId,
    message: getParentAbsenceMessage(NotificationEvent.CREATED, studentName, schedule.course.name, day),
    resourceType: Resource.ATTENDANCE,
    resourceId: attendanceId,
    event: NotificationEvent.CREATED,
    metadata: { target: { type: "SCHEDULE", id: scheduleId } },  // lien vers la séance
  });
}
2. Justificatif déposé, vers la direction
typescript
// messages/justification.messages.ts
export function getJustificationMessage(
  event: NotificationEvent,
  studentName: string,
  day: string,
): string {
  if (event === "CONFIRMED") return `Le justificatif d'absence du ${day} a été accepté.`;
  if (event === "REJECTED")  return `Le justificatif d'absence du ${day} a été refusé.`;
  return `${studentName} a déposé un justificatif pour son absence du ${day}.`;
}
typescript
// dépôt → direction
sendPushNotificationById(directionUserId, {
  orgId,
  message: getJustificationMessage(NotificationEvent.CREATED, studentName, day),
  resourceType: Resource.JUSTIFICATION,
  resourceId: justificationId,
  event: NotificationEvent.CREATED,
});

// décision → élève et parents
sendPushNotificationById(recipientUserId, {
  orgId,
  message: getJustificationMessage(decision, studentName, day),   // CONFIRMED | REJECTED
  resourceType: Resource.JUSTIFICATION,
  resourceId: justificationId,
  event: decision,
});

REJECTED n’existe pas encore dans NotificationEvent. S’il n’est pas ajouté, le refus se dirait CANCELED, ce qui est faux : le justificatif n’est pas annulé, il est refusé.

3. Invitation étudiant acceptée, vers l’auteur et la direction
typescript
// messages/invitation.messages.ts (ajout)
if (event === "CONFIRMED") return `${invitedEmail} a accepté l'invitation${suffix}`;
typescript
sendPushNotificationById(userId, {
  orgId,
  message: getInvitationStakeholdersMessage(NotificationEvent.CONFIRMED, invitedEmail, className),
  resourceType: Resource.INVITATION,
  resourceId: invitationId,
  event: NotificationEvent.CONFIRMED,
});
4. Élève inscrit dans une classe, vers l’élève
typescript
// messages/class.messages.ts
export function getClassEnrollmentMessage(event: NotificationEvent, className: string): string {
  if (event === "UNASSIGNED") return `Vous n'êtes plus inscrit dans la classe ${className}.`;
  return `Vous avez été inscrit dans la classe ${className}.`;
}
typescript
sendPushNotificationById(studentUserId, {
  orgId,
  message: getClassEnrollmentMessage(NotificationEvent.ASSIGNED, className),
  resourceType: Resource.CLASS,
  resourceId: classId,
  event: NotificationEvent.ASSIGNED,
});

Le retrait est le même appel avec UNASSIGNED. Ce sont les deux valeurs de l’enum qu’on avait rendues génériques.

5. Note publiée, vers l’élève et les parents
typescript
// messages/grade.messages.ts
export function getGradeMessage(event: NotificationEvent, courseName: string): string {
  if (event === "UPDATED") return `Une note en ${courseName} a été corrigée.`;
  return `Une nouvelle note est disponible en ${courseName}.`;
}
typescript
sendPushNotificationById(recipientUserId, {
  orgId,
  message: getGradeMessage(NotificationEvent.CREATED, courseName),
  resourceType: Resource.GRADE,
  resourceId: gradeId,
  event: NotificationEvent.CREATED,
  metadata: { target: { type: "COURSE", id: courseId } },
});

Je n’y mets pas la valeur de la note : ça s’afficherait sur l’écran verrouillé de n’importe quel appareil, et l’élève la voit en ouvrant la notification.

6. Nouveau message, vers les membres du canal
typescript
// messages/chat.messages.ts
export function getChatMessage(senderName: string, content: string): string {
  const preview = content.length > 80 ? `${content.slice(0, 80)}…` : content;
  return `${senderName} : ${preview}`;
}
typescript
sendPushNotificationById(memberUserId, {
  orgId,
  message: getChatMessage(senderName, message.content),
  resourceType: Resource.MESSAGE,
  resourceId: message.id,
  event: NotificationEvent.CREATED,
  metadata: { channelId },   // seul cas où l'UI en a besoin pour construire le lien
});