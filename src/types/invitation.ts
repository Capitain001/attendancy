// types/invitation.ts
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Functions, Organization, Role } from "./user";

import { Resource } from "@/generated/prisma/client";
import { TeacherResources } from '@/modules/invitation/teacher/invite';

// export type AdminFunction = Functions
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED";

export interface EnrollmentDetails {
  classId?:     string;
  groupIds?:    string[];
  parentEmail?: string;
}

/** Lien parent→étudiant à matérialiser à l'acceptation (invitation PARENT externe, P-18 B). */
export interface ParentLinkDetails {
  studentId: string;
  relation:  string;
}

export interface InvitedBy {
  id: string;
  name: string;
  email: string;
}

export interface InvitationMetadata {
  role: Role;
  name?: string;
  function?: Functions;
  organization: Organization;
  organizations: Organization[];
  invited_by: InvitedBy;
  status: InvitationStatus;
  invitationToken: string;
  invitationType: "INVITE_ONLY";
}

export interface DatabaseInvitationDetails {
  role:           Role;
  name?:          string;
  function?:      Functions;
  additionalFunctions?: string[];
  organization:   Organization;
  invited_by:     InvitedBy;
  status:         string;
  invitationType: string;
  enrollment?:    EnrollmentDetails;
  parentLink?:    ParentLinkDetails;
  [key: string]:  unknown;
}
export interface InvitationParams {
  email:          string;
  name?:          string;
  role:           Role;
  adminFunction?: Functions;
  permissions?:   string[];
  departmentId?:  string;
  resources?:     TeacherResources;
  resourceId?:    string;        // ID de la ressource liée (classe, événement, etc.)
  resourceType?:  Resource;      // Type de ressource (CLASS, EVENT, etc.)
  /** Durée de validité du token en jours (1, 3, 7, 14 ou 30). Défaut : 7 */
  expiresInDays?: number;
}

export interface InvitationResult {
  success: boolean;
  error?: string;
  message?: string;
  metadata?: InvitationMetadata;
}

export type User = SupabaseUser

// Types pour les différents contextes d'utilisation
export interface SupabaseInviteData extends InvitationMetadata {}

  export interface AuditLogDetails {
    email: string;
    name?: string;
    orgId: string;
    departmentId?: string;
    role: string;
  function?: Functions;
    [key: string]: any; // Signature d'index pour compatibilité Prisma
  }


/* 
###structure json invitation envoyé par l'admin pour un enseignant (pas encore accepter) ###

{
  "id": "652dbd9f-00ba-4978-be02-68ca2fca3adf",
  "token": "ecff6205e6ae859e5c9e069648728b12c7e027f1a984f4ab3a181d72215ce281",
  "email": "sqdqadmis@yopmail.com",
  "organizationId": "11e4397e-4a1a-4c99-9be9-f8213799cc62",
  "createdAt": "2025-12-04T11:06:22.264Z",
  "expiresAt": "2025-12-11T11:06:20.142Z",
  "usedAt": null,
  "userId": null,
  "details": {
    "name": "invited teacher",
    "role": "TEACHER",
    "status": "PENDING",
    "invited_by": {
      "id": "57a001c5-1a27-4733-9310-51f54e4c3253",
      "name": "responsable philip",
      "email": "piratestuart@gmail.com"
    },
    "organization": {
      "id": "11e4397e-4a1a-4c99-9be9-f8213799cc62",
      "logo": "blob:http://localhost:3000/7f1fa5d5-3581-4cd5-8c6e-061d412540fd",
      "name": "havard",
      "slug": "havard",
      "permissions": [
        "CREATE:USER"
      ]
    },
    "invitationType": "INVITE_ONLY"
  },
  "invitationType": "INVITE_ONLY",
  "eventId": null
}

 */


/* 
###structure json invitation accepter par l'utilisateur ###
  {
    "id": "16a75206-47a5-4cde-8e62-39b5f0b37e40",
    "token": "e3463da90c3f3bf8442b6fcd0b931c509805d873d11541aecb239be5fdb6d327",
    "email": "cdqadmin-att@yopmail.com",
    "organizationId": "11e4397e-4a1a-4c99-9be9-f8213799cc62",
    "createdAt": "2025-12-02T09:06:32.903Z",
    "expiresAt": "2025-12-09T09:06:31.501Z",
    "usedAt": "2025-12-02T09:09:29.555Z",
    "userId": "657534b4-594c-4969-9460-c88550547501",
    "details": {
      "name": "LOhom soleil",
      "role": "TEACHER",
      "status": "PENDING",
      "invited_by": {
        "id": "57a001c5-1a27-4733-9310-51f54e4c3253",
        "name": "responsable philip",
        "email": "piratestuart@gmail.com"
      },
      "organization": {
        "id": "11e4397e-4a1a-4c99-9be9-f8213799cc62",
        "logo": "blob:http://localhost:3000/7f1fa5d5-3581-4cd5-8c6e-061d412540fd",
        "name": "havard",
        "slug": "havard",
        "permissions": [
          "READ:COURSE"
        ]
      },
      "invitationType": "INVITE_ONLY"
    },
    "invitationType": "INVITE_ONLY",
    "eventId": null
  }
   */
