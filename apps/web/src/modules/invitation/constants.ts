// src/modules/invitation/constants.ts

/**
 * Modes de remise d'une invitation :
 * - "email" : Supabase envoie lui-même l'email d'invitation (comportement par défaut)
 * - "link"  : on crée l'utilisateur et récupère le lien nous-mêmes, sans email Supabase
 */
export const DELIVERY_METHODS = ["email", "link"] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/** Actions déclenchées à l'acceptation d'une invitation. Source unique : le schéma de notification s'en sert aussi. */
export const INVITATION_ACTIONS = ["JOIN_ORG", "JOIN_CLASS", "GRANT_ROLE"] as const;

export type InvitationAction = (typeof INVITATION_ACTIONS)[number];