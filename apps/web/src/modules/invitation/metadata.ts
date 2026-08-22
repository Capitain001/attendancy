// ==========================================
// src/modules/invitation/metadata.ts
// ==========================================
/**
 * Service de génération des métadonnées d'invitation
 * 
 * @description Génère les métadonnées complètes nécessaires pour créer une invitation
 * @example
 * const metadata = generateInvitationMetadata(
 *   { email: "user@example.com", role: "TEACHER" },
 *   currentUser,
 *   "token123"
 * );
 */

import { Functions, Organization, Role, UserInfo, UserStatus } from "@/types";
import { InvitationMetadata } from "@/types/invitation";

interface MetadataParams {
  email: string;
  name?: string;
  role: Role;
  function?: Functions;
  permissions?: string[];
  departmentId?: string;
  resources?: { courses?: string[]; classes?: string[] };
  details?: {
    enrollment?: import("@/types/invitation").EnrollmentDetails;
    parentLink?: import("@/types/invitation").ParentLinkDetails;
  };
}

export function generateInvitationMetadata(
  params: MetadataParams,
  user: UserInfo,
  token: string,
  userStatus: UserStatus
): InvitationMetadata {
  const organization: Organization = {
    id: user.organization?.id!,
    name: user.organization?.name!,
    slug: user.organization?.slug || "",
    logo: user.organization?.logo || "",
    permissions: params.permissions || [],
    departmentId: params.departmentId,
  };

  const invited_by = {
    id: user.id!,
    name: user.name || user.email?.split("@")[0] || "",
    email: user.email || "",
  };

  return {
    role: params.role,
    name: params.name,
    function: params.function || undefined,
    organization,
    organizations: [organization],
    invited_by,
    status: userStatus,
    invitationStatus: "PENDING",
    invitationToken: token,
    invitationType: "INVITE_ONLY",
    details: params.details,
  };
}
