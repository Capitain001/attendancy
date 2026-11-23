import { OrganizationType, Role as DBRole } from "@attendancy/db/browser";
import { FUNCTIONS } from "./functions";

/* =========================
   ÉNUMÉRATIONS
========================= */

export const ROLES = [
  DBRole.ADMIN,
  DBRole.TEACHER,
  DBRole.STUDENT,
  DBRole.PARENT,
  DBRole.DIRECTION,
] as const satisfies readonly DBRole[];

/** Rôles applicatifs : rôles DB + GUEST. */
export const UserRoles = { GUEST: "GUEST", ...DBRole } as const;

export const Functions = FUNCTIONS;

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  ON_LEAVE: "ON_LEAVE",
  PENDING: "PENDING",
  NEW: "NEW",
  INVITED: "INVITED",
} as const;

export type Role = (typeof UserRoles)[keyof typeof UserRoles];
export type Functions = (typeof Functions)[keyof typeof Functions];
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/* =========================
   INTERFACES MÉTIER (Source unique de vérité)
========================= */

export interface InvitedBy {
  id?: string;
  name?: string;
  email?: string;
}

export interface Organization {
  id?: string;
  name?: string;
  slug?: string;
  logo?: string;
  type?: OrganizationType;
  responsable?: boolean;
  departmentId?: string;
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  directionId?: string;
}

/**
 * app_metadata : tout ce qui sert à autoriser.
 * Écriture réservée au serveur (service role) via `setUserAccess` / `updateUserAccess`.
 * Lecture : sans repli sur `user_metadata`, une clé absente donne la valeur la plus restrictive.
 */
export interface AppMetadata {
  role?: Role;
  function?: Functions;
  status?: UserStatus;
  organization?: Organization;
  organizations?: Organization[];
}

/**
 * user_metadata : données de profil.
 * Modifiables par le client (API Auth + clé publique) → ne JAMAIS s'en servir
 * pour autoriser une action.
 * Écriture : `setUserInfo` (utilisateur courant) ou `updateUserMetadata` (utilisateur cible).
 */
export interface UserMetadata {
  name?: string;
  avatar_url?: string;
  phone?: string;
  isConnected?: boolean;
  invited_by?: InvitedBy;
  invitationToken?: string;
  invitationType?: string;
}

export type AppMetadataKey = keyof AppMetadata;
export type UserMetadataKey = keyof UserMetadata;

/** Clés parcourues à l'exécution (réinitialisation, filtre d'invitation). */
export const APP_METADATA_KEYS = [
  "role",
  "function",
  "status",
  "organization",
  "organizations",
] as const satisfies readonly AppMetadataKey[];

export const USER_METADATA_KEYS = [
  "name",
  "avatar_url",
  "phone",
  "isConnected",
  "invited_by",
  "invitationToken",
  "invitationType",
] as const satisfies readonly UserMetadataKey[];

/**
 * Champs fournis par Supabase Auth ou calculés à l'exécution :
 * jamais écrits dans les metadata, aucun code ne les parcourt.
 */
export interface AuthMetadata {
  id: string;
  email?: string;
  email_verified?: boolean; // dérivé de user.email_confirmed_at
  phone_verified?: boolean; // dérivé de user.phone_confirmed_at
  online_at?: string; // présence temps réel
  /** Fourni par Supabase Auth (user.updated_at), mis à jour à chaque updateUser/updateUserById. */
  updated_at?: string;
}

/** Vue unifiée : l'appelant ne sait pas de quel magasin vient un champ. */
export interface UserInfo extends AppMetadata, UserMetadata, AuthMetadata {}

export type AuthenticatedUser = UserInfo & {
  id: string;
  role: Role;
  function: Functions;
  name: string;
  /** Garanti par le flow d'inscription actuel (owner ou invité : les deux exigent un email).
   *  À revalider si un nouveau flow d'auth (OAuth, SSO...) est ajouté. */
  email: string;
};
