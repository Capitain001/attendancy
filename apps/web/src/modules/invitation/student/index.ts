// src/services/invitation/student/index.ts

/**
 * Service d'invitation des étudiants
 * 
 * Ce service permet d'inviter des étudiants dans l'organisation.
 * Les informations d'inscription (sous-classe, année académique, groupe) sont stockées
 * dans les détails de l'invitation et seront utilisées lors de l'acceptation pour créer
 * l'inscription (StudentEnrollment) et éventuellement lier un parent.
 */

export { inviteStudent, getClassInvitationsAction } from "./actions";
export type { InviteStudentParams } from "./types";
export { inviteStudentSchema } from "./validation";
export type { InviteStudentInput } from "./validation";
export { checkInvitationResources, getClassInvitations } from "./database";

