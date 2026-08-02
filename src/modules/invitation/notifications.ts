import { prisma } from "@/lib/prisma";
import { NotificationType, Role } from "@prisma/client";
import { sendPushNotificationById } from "@/services/notification/action";

export type InvitationNotifyEvent = "CREATED" | "RESENT" | "LINK_GENERATED";

const DIRECTION_FUNCTION_NAMES = ["PRINCIPAL", "SECRETARY"] as const;

function buildMessage(event: InvitationNotifyEvent, invitedEmail: string): string {
  switch (event) {
    case "CREATED":
      return `Invitation étudiant envoyée à ${invitedEmail}`;
    case "RESENT":
      return `Invitation étudiant renvoyée pour ${invitedEmail}`;
    case "LINK_GENERATED":
      return `Lien d'invitation généré pour ${invitedEmail}`;
    default:
      return `Mise à jour d'invitation pour ${invitedEmail}`;
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
}): Promise<void> {
  try {
    const { invitationId, orgId, actorId, event, invitedEmail, classId } = params;

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

    const message = buildMessage(event, invitedEmail);
    const metadata = {
      kind: "student_invitation" as const,
      invitationId,
      event,
      ...(classId ? { classId } : {}),
    };

    await Promise.allSettled(
      [...recipientIds].map((userId) =>
        sendPushNotificationById(userId, {
          message,
          type: NotificationType.INVITATION,
          metadata,
        })
      )
    );
  } catch (error) {
    console.error("[notifyInvitationStakeholders]", error);
  }
}
