// ==========================================
// src/modules/invitation/database.ts
// ==========================================

import { prisma } from "@/lib/prisma";
import { invalidateEvent } from "@/cache/server/graph";
import { createInvitationNotification } from "@/services/notification/server";
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
    status:         metadata.invitationStatus,
    invitationType: metadata.invitationType,
    ...(metadata.details || {}),
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

export interface SaveInvitationParams {
  email: string;
  token: string;
  expiresAt: Date;
  metadata: InvitationMetadata;
  inviterUserId: string;
  action: Action;
  resourceId?: string;
  resourceType?: Resource;
  targetUserId?: string;
}

export async function saveInvitationWithAudit(params: SaveInvitationParams) {
  const invitationDetails = createDatabaseDetails(params.metadata);
  const auditDetails = createAuditDetails(params.email, params.metadata);
  const orgId = params.metadata.organization?.id;
  if (!orgId) throw new Error("Organisation manquante dans les métadonnées d'invitation");

  const result = await prisma.$transaction(
    async (tx) => {
      const invitation = await tx.invitation.create({
        data: {
          email: params.email,
          token: params.token,
          expiresAt: params.expiresAt,
          orgId,
          invitationType: "INVITE_ONLY",
          role: params.metadata.role,
          details: invitationDetails,
          ...(params.targetUserId ? { userId: params.targetUserId } : {}),
          ...(params.resourceId ? { resourceId: params.resourceId } : {}),
          ...(params.resourceType ? { resourceType: params.resourceType } : {}),
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: params.inviterUserId,
          action: params.action,
          resourceId: invitation.id || undefined,
          resource: "USER",
          details: auditDetails,
        },
      });

      const notification = params.targetUserId
        ? await createInvitationNotification(tx, {
            userId: params.targetUserId,
            source: {
              invitationId: invitation.id,
              expiresAt: params.expiresAt,
              role: params.metadata.role,
              organization: { ...params.metadata.organization, id: orgId },
              senderName: params.metadata.invited_by?.name,
              resourceId: params.resourceId,
              resourceType: params.resourceType,
            },
          })
        : null;

      return { invitation, auditLog, notification };
    },
    { maxWait: 10000, timeout: 20000 },
  );

  // Après commit uniquement : invalidé dans la tx, le cache pourrait se re-remplir avec l'ancien état.
  // Un échec d'invalidation ne doit pas faire échouer une invitation déjà persistée.
  if (result.notification && params.targetUserId) {
    try {
      await invalidateEvent("NOTIFICATION_CREATED", params.targetUserId);
    } catch (error) {
      console.error("[saveInvitationWithAudit] invalidation cache notification échouée", error);
    }
  }

  return result;
}

export interface InvitationListItem {
  id:        string;
  email:     string;
  createdAt: Date;
  expiresAt: Date | null;
  usedAt:    Date | null;
  details:   DatabaseInvitationDetails | null;
  role:      string | null;
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
    token: inv.token,
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
