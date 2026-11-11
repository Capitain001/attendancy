// src/modules/invitation/student/types.ts
// src/services/invitation/student/types.ts

/**
 * Types spécifiques pour l'invitation des étudiants
 */

export interface InviteStudentParams {
  email: string;
  firstName?: string;
  lastName?: string;

  classId: string; // ID de la classe où l'étudiant sera inscrit
  groupIds?: string[]; // IDs des groupes (optionnel)

  parentEmail?: string; // Email du parent à lier (optionnel)

  /** Durée de validité du token d'invitation en jours (1, 3, 7, 14 ou 30). Défaut : 7 */
  expiresInDays?: number;
  deliveryMethod?: "email" | "link"
}


import type { inviteStudent } from './actions'

export type InviteStudentResult = Awaited<ReturnType<typeof inviteStudent>>

export type BulkInviteItemSuccess = {
  email: string;
  invitationId?: string;
  link?: string;
};

export type BulkInviteItemFailure = {
  email: string;
  error: string;
};

export type BulkInviteData = {
  status: "ok" | "partial" | "failed";
  total: number;
  succeeded: BulkInviteItemSuccess[];
  failed: BulkInviteItemFailure[];
};

export type InviteStudentsBulkResult =
  | { data: BulkInviteData }
  | { error: string };