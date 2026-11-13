// src/modules/invitation/database.ts
// ==========================================
// src/modules/invitation/database.ts
// ==========================================

import { prisma } from "@/lib/prisma";
import { invalidateEvent } from "@/cache/server/graph";
import { createInvitationNotification } from "@/services/notification/server";
import { buildInvitationNotificationPayload } from "@/services/notification/messages";
import { Prisma } from "@/generated/prisma/client";
import {
  InvitationMetadata,
  DatabaseInvitationDetails,
  AuditLogDetails,
} from "@/types/invitation";
import type {
  Action,
  InvitationStatus,
  Resource,
  Role,
} from "@/generated/prisma/client";

function createDatabaseDetails(
  metadata: InvitationMetadata,
): Prisma.InputJsonValue {
  return {
    role: metadata.role,
    name: metadata.name,
    function: metadata.function,
    organization: metadata.organization,
    invited_by: metadata.invited_by,
    invitationType: metadata.invitationType,
    ...(metadata.details || {}),
  } as unknown as Prisma.InputJsonValue;
}

function createAuditDetails(
  email: string,
  metadata: InvitationMetadata,
): AuditLogDetails {
  return {
    email,
    name: metadata.name || email.split("@")[0],
    orgId: metadata.organization?.id!,
    role: metadata.role,
    function: metadata.function || undefined,
    departmentId: metadata.organization?.departmentId || undefined,
  };
}

export async function saveInvitationToDatabase(
  email: string,
  token: string,
  expiresAt: Date,
  metadata: InvitationMetadata,
  resourceId?: string,
  resourceType?: Resource,
): Promise<void> {
  const details = createDatabaseDetails(metadata);

  await prisma.invitation.create({
    data: {
      email,
      token,
      expiresAt,
      orgId: metadata?.organization?.id!,
      invitationType: "INVITE_ONLY",
      details,
      ...(resourceId ? { resourceId } : {}),
      ...(resourceType ? { resourceType } : {}),
    },
  });
}

export async function logAuditAction(
  userId: string,
  action: Action,
  email: string,
  metadata: InvitationMetadata,
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
  resourceName?: string | null;
  isExistingMember?: boolean;
  targetUserId?: string;
}

export async function saveInvitationWithAudit(params: SaveInvitationParams) {
  const invitationDetails = createDatabaseDetails(params.metadata);
  const auditDetails = createAuditDetails(params.email, params.metadata);
  const orgId = params.metadata.organization?.id;
  if (!orgId)
    throw new Error("Organisation manquante dans les métadonnées d'invitation");

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
            payload: buildInvitationNotificationPayload({
              invitationId: invitation.id,
              expiresAt: params.expiresAt,
              role: params.metadata.role,
              organization: { ...params.metadata.organization, id: orgId },
              sender: {
                id: params.inviterUserId,
                name: params.metadata.invited_by?.name,
              },
              resourceId: params.resourceId,
              resourceType: params.resourceType,
              resourceName: params.resourceName,
              isExistingMember: params.isExistingMember,
            }),
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
      console.error(
        "[saveInvitationWithAudit] invalidation cache notification échouée",
        error,
      );
    }
  }

  return result;
}

export async function revokePendingInvitationsForResource(
  tx: Prisma.TransactionClient,
  params: {
    orgId: string;
    email: string;
    resourceId: string;
    resourceType: Resource;
    acceptedInvitationId: string;
    revokedAt: Date;
  },
) {
  const where: Prisma.InvitationWhereInput = {
    orgId: params.orgId,
    email: { equals: params.email, mode: "insensitive" },
    resourceId: params.resourceId,
    resourceType: params.resourceType,
    status: "PENDING",
    id: { not: params.acceptedInvitationId },
    OR: [{ expiresAt: null }, { expiresAt: { gt: params.revokedAt } }],
  };
  const pendingInvitations = await tx.invitation.findMany({
    where,
    select: { id: true, userId: true },
  });

  const revokedInvitations: typeof pendingInvitations = [];
  for (const invitation of pendingInvitations) {
    const result = await tx.invitation.updateMany({
      where: { ...where, id: invitation.id },
      data: { status: "REVOKED", usedAt: params.revokedAt },
    });

    if (result.count > 0) revokedInvitations.push(invitation);
  }

  return revokedInvitations;
}

export interface InvitationListItem {
  id: string;
  email: string;
  createdAt: Date;
  expiresAt: Date | null;
  status: InvitationStatus;
  usedAt: Date | null;
  details: DatabaseInvitationDetails | null;
  role: string | null;
}

export interface InvitationStats {
  total: number;
  pending: number;
  expired: number;
  accepted: number;
  revoked: number;
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
    where: { orgId, status: { not: "REVOKED" }, ...(role ? { role } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    status: inv.status,
    usedAt: inv.usedAt,
    role: inv.role,
    details: inv.details ? (inv.details as DatabaseInvitationDetails) : null,
    token: inv.token,
  }));
}

export async function getInvitationStats(
  orgId: string,
): Promise<InvitationStats> {
  const now = new Date();

  const [total, pending, expired, accepted, revoked] =
    await prisma.$transaction([
      prisma.invitation.count({ where: { orgId } }),
      prisma.invitation.count({
        where: {
          orgId,
          status: "PENDING",
          OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
        },
      }),
      prisma.invitation.count({
        where: { orgId, status: "PENDING", expiresAt: { lt: now } },
      }),
      prisma.invitation.count({
        where: { orgId, status: "ACCEPTED" },
      }),
      prisma.invitation.count({
        where: { orgId, status: { in: ["DECLINED", "REVOKED"] } },
      }),
    ]);

  return { total, pending, expired, accepted, revoked };
}

export async function updateInvitationToken(
  invitationId: string,
  token: string,
  expiresAt: Date,
  orgId: string,
): Promise<void> {
  try {
    await prisma.invitation.update({
      where: { id: invitationId, orgId, status: "PENDING" },
      data: { token, expiresAt },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Invitation introuvable, révoquée ou déjà traitée");
    }
    throw error;
  }
}
