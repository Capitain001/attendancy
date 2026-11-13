// src/modules/invitation/notifications.ts
import { prisma } from "@/lib/prisma";
import { NotificationEvent, Resource, Role } from "@/generated/prisma/browser";
import { sendPushNotificationById } from "@/services/notification/server";

export type InvitationNotifyEvent = "CREATED" | "RESENT" | "LINK_GENERATED";

const DIRECTION_FUNCTION_NAMES = ["PRINCIPAL", "SECRETARY"] as const;

function buildMessage(
  event: InvitationNotifyEvent,
  invitedEmail: string,
  className?: string | null,
): string {
  const suffix = className ? ` (classe ${className})` : "";
  switch (event) {
    case "CREATED":
      return `Invitation étudiant envoyée à ${invitedEmail}${suffix}`;
    case "RESENT":
      return `Invitation étudiant renvoyée pour ${invitedEmail}${suffix}`;
    case "LINK_GENERATED":
      return `Lien d'invitation généré pour ${invitedEmail}${suffix}`;
    default:
      return `Mise à jour d'invitation pour ${invitedEmail}${suffix}`;
  }
}

/**
 * Notifie l'auteur de l'action et les membres DIRECTION ayant la fonction PRINCIPAL ou SECRETARY.
 * Ne bloque jamais le flux appelant (erreurs absorbées).
 */
export async function notifyInvitationStakeholders(params: {
  invitationId: string;
  orgId: string;
  actorId: string;
  event: InvitationNotifyEvent;
  invitedEmail: string;
  classId?: string;
  className?: string | null;
}): Promise<void> {
  try {
    const { invitationId, orgId, actorId, event, invitedEmail, classId, className } = params;

    const directionRows = await prisma.userOrganization.findMany({
      where: {
        orgId,
        role: Role.DIRECTION,
        user: {
          functions: {
            some: {
              function: {
                orgId,
                name: { in: [...DIRECTION_FUNCTION_NAMES] },
              },
            },
          },
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    const recipientIds = new Set<string>([actorId]);
    for (const row of directionRows) {
      recipientIds.add(row.userId);
    }

    const message = buildMessage(event, invitedEmail, className);
    const metadata = {
      kind: "student_invitation" as const,
      invitationId,
      event,
      ...(classId ? { classId } : {}),
    };

    await Promise.allSettled(
      [...recipientIds].map((userId) =>
        sendPushNotificationById(userId, {
          orgId,
          message,
          resourceType: Resource.INVITATION,
          resourceId: invitationId,
          event:
            event === "CREATED"
              ? NotificationEvent.CREATED
              : NotificationEvent.UPDATED,
          metadata,
        })
      )
    );
  } catch (error) {
    console.error("[notifyInvitationStakeholders]", error);
  }
}
