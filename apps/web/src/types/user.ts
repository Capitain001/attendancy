//src/types/user.ts
import * as v from 'valibot'
import { FUNCTIONS } from '@/config/data'
import { OrganizationType, Role as DBRole } from '@/generated/prisma/browser'

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

const roleSchema = v.enum_(UserRoles)
const functionSchema = v.enum_(Functions)
const statusSchema = v.enum_(UserStatus)

export type Role = v.InferOutput<typeof roleSchema>
export type Functions = v.InferOutput<typeof functionSchema>
export type UserStatus = v.InferOutput<typeof statusSchema>

/* =========================
   SCHÉMAS (source unique : types ET clés en sont déduits)
========================= */

export const InvitedBySchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.string(),
})

export const OrganizationSchema = v.partial(
  v.object({
    id: v.string(),
    name: v.string(),
    slug: v.string(),
    logo: v.string(),
    type: v.enum_(OrganizationType), // 'INSTITUTION' | 'PERSONAL'
    permissions: v.array(v.string()),
    responsable: v.boolean(),
    departmentId: v.string(),
    studentId: v.string(),   // id du profil étudiant
    teacherId: v.string(),   // id du profil enseignant
    parentId: v.string(),    // id du profil parent
    directionId: v.string(), // id du profil direction
  }),
)

/**
 * app_metadata : tout ce qui sert à autoriser.
 * Écriture réservée au serveur (service role) via `setUserAccess` / `updateUserAccess`.
 * Lecture : sans repli sur `user_metadata`, une clé absente donne la valeur la plus restrictive.
 */
export const AppMetadataSchema = v.partial(
  v.object({
    role: roleSchema,
    function: functionSchema,
    status: statusSchema,
    organization: OrganizationSchema,
    organizations: v.array(OrganizationSchema),
  }),
)

/**
 * user_metadata : données de profil.
 * Modifiables par le client (API Auth + clé publique) → ne JAMAIS s'en servir
 * pour autoriser une action.
 * Écriture : `setUserInfo` (utilisateur courant) ou `updateUserMetadata` (utilisateur cible).
 */
export const UserMetadataSchema = v.partial(
  v.object({
    name: v.string(),
    avatar_url: v.string(),
    phone: v.string(),
    isConnected: v.boolean(),
    invited_by: v.partial(InvitedBySchema),
    invitationToken: v.string(),
    invitationType: v.string(),
  }),
)

/* =========================
   TYPES DÉDUITS
========================= */

export type InvitedBy = v.InferOutput<typeof InvitedBySchema>
export type Organization = v.InferOutput<typeof OrganizationSchema>
export type AppMetadata = v.InferOutput<typeof AppMetadataSchema>
export type UserMetadata = v.InferOutput<typeof UserMetadataSchema>
export type AppMetadataKey = keyof AppMetadata
export type UserMetadataKey = keyof UserMetadata

/** Clés parcourues à l'exécution (réinitialisation, filtre d'invitation). */
export const APP_METADATA_KEYS = Object.keys(AppMetadataSchema.entries) as AppMetadataKey[]
export const USER_METADATA_KEYS = Object.keys(UserMetadataSchema.entries) as UserMetadataKey[]

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