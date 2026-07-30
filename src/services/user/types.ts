// src/services/user/types.ts
import { FUNCTIONS } from "@/config/data";
import { UserStatus as DBUserStatus } from "@/generated/prisma"


export const UserRoles = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  GUEST: "GUEST",
  DIRECTION: "DIRECTION"
} as const;


export type Role = typeof UserRoles[keyof typeof UserRoles];

// ── Fonctions (RBAC fin, orthogonal au rôle) ─────────────────────────────────

export const Functions = FUNCTIONS;

export type Functions = typeof Functions[keyof typeof Functions];

export const UserStatus = {
  ...DBUserStatus,
  NEW: "NEW",           // Nouveau compte
  INVITED: "INVITED",   // Invitation envoyée mais non acceptée
} as const;


export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

// ── Organisation ─────────────────────────────────────────────────────────────
// Snapshot org stocké en Supabase user_metadata — PAS le modèle Prisma.
// Les champs ci-dessous sont architecturaux (identité + permissions).
export interface Organization {
  id?: string
  name?: string
  slug?: string
  logo?: string
  responsable?: boolean
  permissions?: string[]

  teacherId?:   string
  studentId?:   string
  parentId?:    string
  directionId?: string
}

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

export interface InvitedBy {
  id: string
  name: string
  email: string
}

// ── UserInfo ─────────────────────────────────────────────────────────────────
// Source de vérité user — retourné par getUserInfo().
export interface UserInfo {
  id?: string;
  email?: string;
  role?: Role;
  name?: string;
  avatar_url?: string;
  phone?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  function?: Functions;
  organization?: Organization;
  organizations?: Organization[];
  invited_by?: Partial<InvitedBy>;
  status?: UserStatus;
  invitationToken?: string;
  invitationType?: string;
  isConnected?: boolean;
  online_at?: string;
}



//  Typage spécifique aux métadonnées Supabase (aligné avec UserInfo)
export type UserMetadata = Pick<UserInfo,
  | "role"
  | "name"
  | "avatar_url"
  | "phone"
  | "email_verified"
  | "phone_verified"
  | "function"
  | "organization"
  | "organizations"
  | "invited_by"
  | "status"
  | "invitationToken"
  | "invitationType"
  | "isConnected"
>;



export type OrgContext = {
  userId: string
  orgId: string
  role: Role
  function: Functions
}


/* 
###structure json ###
{
  "role": "ADMIN",
  "name": "Pirates Stuart ",
  "avatar_url": "https://kyitmnunzsqyhqbkzekk.supabase.co/storage/v1/object/public/avatars/713ca158-ba30-4761-abdb-cb365343f011/avatar.png",
  "function": "SUPER_ADMIN",
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
  ],
  "invited_by": {
    "id": "713ca158-ba30-4761-abdb-cb365343f011",
    "name": "Pirates Stuart ",
    "email": "piratestuart@gmail.com"
  },
  "status": "PENDING",
  "invitationToken": "dba3f42d-f071-429f-8186-b3863eea88eb",
  "invitationType": "INVITE_ONLY",
  "email_verified": true,
  "phone_verified": false
}

*/