// Barrel des actions/​types invitation consommés par le frontend (hooks/data/invitation).
// Les helpers purs de statut restent importés depuis "./status" (usage client direct).

// Gestion (org)
export {
  resendInvitationAction,
  generateMagicLinkAction,
  deleteInvitationUserAction,
  getInvitationStatsAction,
  getOrgInvitationsAction,
} from "./actions";
export type { InvitationActionResult } from "./actions";

// Invitations par rôle
export { inviteDirection } from "./direction/actions";
export { inviteStudent, getClassInvitationsAction } from "./student/actions";
export { inviteTeacher } from "./teacher/invite";

// Types partagés
export type { InvitationListItem, InvitationStats } from "./database";
