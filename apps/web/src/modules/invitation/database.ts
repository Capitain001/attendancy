// ==========================================
// src/modules/invitation/database.ts
// ==========================================

import { prisma } from "@/lib/prisma";
import {
  InvitationMetadata,
  DatabaseInvitationDetails,
  AuditLogDetails,
} from "@/types/invitation";
import { Action, Prisma, Resource, Role } from "@/generated/prisma/client";

function createDatabaseDetails(
  metadata: InvitationMetadata
): Prisma.InputJsonValue {
  return {
    role:           metadata.role,
    name:           metadata.name,
    function:       metadata.function,
    organization:   metadata.organization,
    invited_by:     metadata.invited_by,
    status:         metadata.status,
    invitationType: metadata.invitationType,
  } as unknown as Prisma.InputJsonValue;
}

function createAuditDetails(
  email: string,
  metadata: InvitationMetadata
): AuditLogDetails {
  return {
    email,
    name:         metadata.name || email.split("@")[0],
    orgId:        metadata.organization?.id!,
    role:         metadata.role,
    function:     metadata.function || undefined,
    departmentId: metadata.organization?.departmentId || undefined,
  };
}

export async function saveInvitationToDatabase(
  email:      string,
  token:      string,
  expiresAt:  Date,
  metadata:   InvitationMetadata,
  resourceId?:   string,
  resourceType?: Resource,
): Promise<void> {
  const details = createDatabaseDetails(metadata);

  await prisma.invitation.create({
    data: {
      email,
      token,
      expiresAt,
      orgId:          metadata?.organization?.id!,
      invitationType: "INVITE_ONLY",
      details,
      ...(resourceId   ? { resourceId }   : {}),
      ...(resourceType ? { resourceType } : {}),
    },
  });
}

export async function logAuditAction(
  userId:   string,
  action:   Action,
  email:    string,
  metadata: InvitationMetadata
): Promise<void> {
  const details = createAuditDetails(email, metadata);

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource: "USER",
      details,
    },
  });
}

export async function saveInvitationWithAudit(
  email:         string,
  token:         string,
  expiresAt:     Date,
  metadata:      InvitationMetadata,
  userId:        string,
  action:        Action,
  resourceId?:   string,
  resourceType?: Resource,
): Promise<{ invitation: any; auditLog: any }> {
  const invitationDetails = createDatabaseDetails(metadata);
  const auditDetails      = createAuditDetails(email, metadata);

  return await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.create({
      data: {
        email,
        token,
        expiresAt,
        orgId:          metadata?.organization?.id!,
        invitationType: "INVITE_ONLY",
        role:           metadata.role as any,
        details:        invitationDetails,
        ...(resourceId   ? { resourceId }   : {}),
        ...(resourceType ? { resourceType } : {}),
      },
    });

    const auditLog = await tx.auditLog.create({
      data: {
        userId,
        action,
        resourceId: invitation.id || undefined,
        resource:   "USER",
        details:    auditDetails,
      },
    });

    return { invitation, auditLog };
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}

export interface InvitationListItem {
  id:        string;
  email:     string;
  createdAt: Date;
  expiresAt: Date | null;
  usedAt:    Date | null;
  details:   DatabaseInvitationDetails | null;
}

export interface InvitationStats {
  total:    number;
  pending:  number;
  expired:  number;
  accepted: number;
}

export async function getOrganizationInvitations({
  orgId,
  limit = 25,
  role,
}: {
  orgId: string;
  limit?: number;
  role?: Role;
}) {
  const invitations = await prisma.invitation.findMany({
    where:   { orgId, ...(role ? { role } : {}) },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });

  return invitations.map((inv) => ({
    id:        inv.id,
    email:     inv.email,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    usedAt:    inv.usedAt,
    role:      inv.role,
    details:   inv.details ? (inv.details as DatabaseInvitationDetails) : null,
  }));
}

export async function getInvitationStats(orgId: string): Promise<InvitationStats> {
  const now = new Date();

  const [total, pending, expired, accepted] = await prisma.$transaction([
    prisma.invitation.count({ where: { orgId } }),
    prisma.invitation.count({
      where: {
        orgId,
        usedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    }),
    prisma.invitation.count({
      where: { orgId, usedAt: null, expiresAt: { lt: now } },
    }),
    prisma.invitation.count({
      where: { orgId, usedAt: { not: null } },
    }),
  ]);

  return { total, pending, expired, accepted };
}

export async function updateInvitationToken(
  invitationId: string,
  token:         string,
  expiresAt:     Date,
  resendLinkBy?: string
): Promise<void> {
  await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      token,
      expiresAt,
      details: { resendLinkBy: resendLinkBy || null },
    },
  });
}