//src/types/user.ts
import { FUNCTIONS } from '@/config/data'
import { OrganizationType, Role as DBRole } from '@/generated/prisma/browser'
import type { User } from '@supabase/supabase-js'

/* =========================
   ÉNUMÉRATIONS
========================= */

export const ROLES = [
  DBRole.ADMIN,
  DBRole.TEACHER,
  DBRole.STUDENT,
  DBRole.PARENT,
  DBRole.DIRECTION,
] as const satisfies readonly DBRole[]

/** Rôles applicatifs : rôles DB + GUEST. */
export const UserRoles = { GUEST: 'GUEST', ...DBRole } as const

export const Functions = FUNCTIONS

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  ON_LEAVE: 'ON_LEAVE',
  PENDING: 'PENDING',
  NEW: 'NEW',
  INVITED: 'INVITED',
} as const

export type Role = (typeof UserRoles)[keyof typeof UserRoles]
export type Functions = (typeof Functions)[keyof typeof Functions]
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

/* =========================
   INTERFACES MÉTIER (Source unique de vérité)
========================= */

export interface InvitedBy {
  id?: string
  name?: string
  email?: string
}

export interface Organization {
  id?: string
  name?: string
  slug?: string
  logo?: string
  type?: OrganizationType
  permissions?: string[]
  responsable?: boolean
  departmentId?: string
  studentId?: string
  teacherId?: string
  parentId?: string
  directionId?: string
}

/**
 * app_metadata : tout ce qui sert à autoriser.
 * Écriture réservée au serveur (service role) via `setUserAccess` / `updateUserAccess`.
 * Lecture : sans repli sur `user_metadata`, une clé absente donne la valeur la plus restrictive.
 */
export interface AppMetadata {
  role?: Role
  function?: Functions
  status?: UserStatus
  organization?: Organization
  organizations?: Organization[]
}

/**
 * user_metadata : données de profil.
 * Modifiables par le client (API Auth + clé publique) → ne JAMAIS s'en servir
 * pour autoriser une action.
 * Écriture : `setUserInfo` (utilisateur courant) ou `updateUserMetadata` (utilisateur cible).
 */
export interface UserMetadata {
  name?: string
  avatar_url?: string
  phone?: string
  isConnected?: boolean
  invited_by?: InvitedBy
  invitationToken?: string
  invitationType?: string
}

export type AppMetadataKey = keyof AppMetadata
export type UserMetadataKey = keyof UserMetadata

/** Clés parcourues à l'exécution (réinitialisation, filtre d'invitation). */
export const APP_METADATA_KEYS = [
  'role',
  'function',
  'status',
  'organization',
  'organizations',
] as const satisfies readonly AppMetadataKey[]

export const USER_METADATA_KEYS = [
  'name',
  'avatar_url',
  'phone',
  'isConnected',
  'invited_by',
  'invitationToken',
  'invitationType',
] as const satisfies readonly UserMetadataKey[]

/**
 * Champs fournis par Supabase Auth ou calculés à l'exécution :
 * jamais écrits dans les metadata, aucun code ne les parcourt.
 */
export interface AuthMetadata {
  id?: string
  email?: string
  email_verified?: boolean // dérivé de user.email_confirmed_at
  phone_verified?: boolean // dérivé de user.phone_confirmed_at
  online_at?: string       // présence temps réel
  /** Fourni par Supabase Auth (user.updated_at), mis à jour à chaque updateUser/updateUserById. */
  updated_at?: string
}

/** Vue unifiée : l'appelant ne sait pas de quel magasin vient un champ. */
export interface UserInfo extends AppMetadata, UserMetadata, AuthMetadata {}

/* =========================
   VARIANTES
========================= */

export type PresenceUser = Pick<
  UserInfo,
  | 'id'
  | 'name'
  | 'email'
  | 'avatar_url'
  | 'role'
  | 'function'
  | 'status'
  | 'organization'
  | 'online_at'
>

export type AuthenticatedUser = UserInfo & {
  id: string
  role: Role
  function: Functions
  name: string
  /** Garanti par le flow d'inscription actuel (owner ou invité : les deux exigent un email).
   *  À revalider si un nouveau flow d'auth (OAuth, SSO...) est ajouté. */
  email: string
}

/* =========================
   PATCHS
========================= */

/** `null` supprime la clé côté Supabase, `undefined` est ignoré. */
type Patch<T> = { [K in keyof T]?: T[K] | null }
export type UserMetadataPatch = Patch<UserMetadata>
export type AppMetadataPatch = Patch<AppMetadata>


/* =========================
   CLIENT READING
========================= */

/**
 * Champs critiques : servent à autoriser ou à rejouer une invitation.
 * Ne doivent jamais atteindre un composant client.
 */
export const SENSITIVE_USER_KEYS = [
  'organizations',    // chaque entrée porte permissions et ids de profils
  'invited_by',
  // 'invitationToken', // token est safe et est utiliser
  'invitationType',
] as const satisfies readonly (keyof UserInfo)[]

export const SENSITIVE_ORGANIZATION_KEYS = [
  'permissions',
  'responsable',
  'departmentId',
  'studentId',
  'teacherId',
  'parentId',
  'directionId',
] as const satisfies readonly (keyof Organization)[]

export type PublicOrganization = Omit<Organization, (typeof SENSITIVE_ORGANIZATION_KEYS)[number]>

/**
 * UserInfo sans les champs critiques : le type à utiliser dans tous les composants client.
 * Pour un besoin ponctuel : `PublicUserInfo & { phone_verified: boolean }`.
 */
export type PublicUserInfo =
  Omit<UserInfo, (typeof SENSITIVE_USER_KEYS)[number] | 'organization'> & {
    organization?: PublicOrganization
  }

/**
 * `User` Supabase dont les deux metadata sont retypées avec les types du projet
 * (Supabase les type en `{ [key: string]: any }`, ce qui n'attrape aucune erreur de clé).
 * Un seul cast à la frontière Supabase : `data.user as SupabaseUser`.
 * Lire `user_metadata.role` y est une erreur TS2339, `role` n'existant que dans `app_metadata`.
 */
export type SupabaseUser = Omit<User, 'app_metadata' | 'user_metadata'> & {
  app_metadata: AppMetadata
  user_metadata: UserMetadata
}

/* ### STRUCTURE JSON ### */

/*
// app_metadata (écrit par le serveur uniquement)
{
  "role": "ADMIN",
  "function": "SUPER_ADMIN",
  "status": "PENDING",
  "organization": {
    "id": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
    "name": "havard",
    "slug": "havard-1",
    "logo": "https://kyitmnunzsqyhqbkzekk.supabase.co/storage/v1/object/public/logos/organizations/2f9867e8-99f8-4b30-8883-8b992cc107c4/logo.png",
    "permissions": [ "READ:COURSE", "UPDATE:STUDENT", "DELETE:STUDENT"] // peut etre adapter 
  },
  "organizations": [
    {
      "id": "2f9867e8-99f8-4b30-8883-8b992cc107c4",
      "name": "havard",
      "slug": "havard-1",
      "logo": "https://kyitmnunzsqyhqbkzekk.supabase.co/storage/v1/object/public/logos/organizations/2f9867e8-99f8-4b30-8883-8b992cc107c4/logo.png",
      "permissions": []
    }
  ]
}

// user_metadata (profil, modifiable par le client)
{
  "name": "Pirates Stuart ",
  "avatar_url": "https://kyitmnunzsqyhqbkzekk.supabase.co/storage/v1/object/public/avatars/713ca158-ba30-4761-abdb-cb365343f011/avatar.png",
  "invited_by": {
    "id": "713ca158-ba30-4761-abdb-cb365343f011",
    "name": "Pirates Stuart ",
    "email": "piratestuart@gmail.com"
  },
  "invitationToken": "dba3f42d-f071-429f-8186-b3863eea88eb",
  "invitationType": "INVITE_ONLY"
}

// AuthMetadata
// email_verified / phone_verified : dérivés de user.email_confirmed_at / phone_confirmed_at 
*/