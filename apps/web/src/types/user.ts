// src/types/user.ts
//src/types/user.ts
import type { User } from '@supabase/supabase-js'
import type {
  AppMetadata,
  Organization,
  UserInfo,
  UserMetadata,
} from '@attendancy/user'

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
  'organizations',    // chaque entrée porte les ids de profils
  'invited_by',
  // 'invitationToken', // token est safe et est utiliser
  'invitationType',
] as const satisfies readonly (keyof UserInfo)[]

export const SENSITIVE_ORGANIZATION_KEYS = [
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