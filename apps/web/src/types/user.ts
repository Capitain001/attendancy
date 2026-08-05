//src/types/user.ts
import { FUNCTIONS } from "@/config/data";
import { InvitedBy } from "./invitation";

export const UserRoles = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  GUEST: "GUEST",
  DIRECTION: "DIRECTION"
} as const;


export type Role = typeof UserRoles[keyof typeof UserRoles];

export const Functions = FUNCTIONS;

export type Functions = typeof Functions[keyof typeof Functions];
export interface Organization {
  id?: string;
  name?: string;
  slug?: string;
  logo?: string;
  permissions?: string[];
  responsable?: boolean
  departmentId?: string;
  studentId?: string;    // id du profile étudiant
  teacherId?: string;    // id du profile enseignant
  parentId?: string;     // id du profile parent
  directionId?: string;  // id du profile direction
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



export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  ON_LEAVE: 'ON_LEAVE',
  PENDING: 'PENDING',
  NEW: 'NEW',
  INVITED: 'INVITED',
} as const;



export type UserStatus = typeof UserStatus[keyof typeof UserStatus];
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


// src/types/user.ts (ajout)
export type AuthenticatedUser = UserInfo & {
  id: string;
  role: Role;
  function: Functions;
  name: string;
  /** Garanti par le flow d'inscription actuel (owner ou invité — les deux exigent un email).
   *  À revalider si un nouveau flow d'auth (OAuth, SSO...) est ajouté. */
  email: string;
};



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