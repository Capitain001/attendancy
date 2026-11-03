// src/services/invitation/student/index.ts

/**
 * Service d'invitation des étudiants
 * 
 * Ce service permet d'inviter des étudiants dans l'organisation.
 * Les informations d'inscription (sous-classe, année académique, groupe) sont stockées
 * dans les détails de l'invitation et seront utilisées lors de l'acceptation pour créer
 * l'inscription (StudentEnrollment) et éventuellement lier un parent.
 */

export { inviteStudent, inviteStudentsAction, getClassInvitationsAction } from "./actions";
export type * from "./types";
export { inviteStudentSchema, inviteStudentsBulkSchema } from "./validation";
export type { InviteStudentInput, InviteStudentsBulkInput } from "./validation";
export { checkInvitationResources, getClassInvitations } from "./database";

