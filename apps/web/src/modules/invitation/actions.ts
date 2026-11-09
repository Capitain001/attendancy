//src/modules/invitation/actions.ts
"use server";

import { after } from "next/server";
import { resendInvitation, generateMagicLink } from "./supabase";
import {
  getInvitationStats,
  getOrganizationInvitations,
  type InvitationListItem,
  updateInvitationToken,
} from "./database";
import { getUserInfo } from "../user";
import { generateInvitationToken } from "./token";
import { deleteAuthUser, findAuthUserByEmail } from "../auth/supabase";
import { prisma } from "@/lib/prisma";
import { ERRORS } from "@/config";
import { notifyInvitationStakeholders } from "./notifications";
import type { DatabaseInvitationDetails } from "@/types/invitation";
import { Role } from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";
import {
  setInvitationNotificationStatus,
  upsertInvitationNotification,
} from "@/services/notification/server";
import { invalidateEvent } from "@/cache/server/graph";

function getStudentInvitationNotifyContext(
  invitation: Pick<InvitationListItem, "id" | "email" | "details">,
  orgId: string,
) {
  const details = invitation.details as DatabaseInvitationDetails | null;
  if (details?.role !== "STUDENT") {
    return null;
  }
  const raw = invitation.details as Record<string, unknown> | null;
  const enrollment = raw?.enrollment as { classId?: string } | undefined;
  return {
    invitationId: invitation.id,
    orgId,
    invitedEmail: invitation.email,
    classId: enrollment?.classId,
  };
}

/**
 * Action serveur pour renvoyer une invitation
 *
 * Les métadonnées sont déjà persistées dans l'utilisateur Supabase.
 * On génère seulement un nouveau token et on met à jour la table invitation.
 * La relecture de l'invitation et son organisation proviennent de la base.
 *
 * @param invitation - L'invitation à renvoyer
 * @returns Résultat de l'opération
 */
export async function resendInvitationAction(
  invitation: InvitationListItem,
) {
  try {
    const user = await getUserInfo();
    const orgId = user?.organization?.id;
    if (!user?.id || !orgId) {
      return { success: false as const, error: "Non authentifié" };
    }

    const stored = await prisma.invitation.findFirst({
      where: { id: invitation.id, orgId, status: "PENDING" },
      select: {
        id: true,
        email: true,
        userId: true,
        role: true,
        details: true,
        resourceId: true,
        resourceType: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!stored) {
      return {
        success: false as const,
        error: "Invitation introuvable ou déjà traitée",
      };
    }

    const recipientId =
      stored.userId ??
      (
        await prisma.user.findFirst({
          where: { email: { equals: stored.email, mode: "insensitive" } },
          select: { id: true },
        })
      )?.id;

    if (recipientId) {
      const { expiresAt } = await generateInvitationToken();
      const details =
        (stored.details as DatabaseInvitationDetails | null) ?? null;
      const role = (stored.role ?? details?.role) as Role | undefined;
      if (!role) {
        return {
          success: false as const,
          error: "Invitation invalide : rôle manquant",
        };
      }

      const source = {
        invitationId: stored.id,
        expiresAt,
        role,
        organization: {
          ...stored.organization,
          slug: stored.organization.slug ?? undefined,
        },
        senderName: details?.invited_by?.name,
        resourceId: stored.resourceId,
        resourceType: stored.resourceType,
      };

      await prisma.$transaction(async (tx) => {
        const updated = await tx.invitation.updateMany({
          where: { id: stored.id, orgId, status: "PENDING" },
          data: { userId: recipientId, expiresAt },
        });
        if (updated.count !== 1) {
          throw new Error("Invitation introuvable ou déjà traitée");
        }

        await upsertInvitationNotification(tx, {
          userId: recipientId,
          source,
        });
      });

      try {
        await invalidateEvent("NOTIFICATION_CREATED", recipientId);
      } catch (error) {
        console.error(
          "[resendInvitationAction] invalidation notification échouée",
          error,
        );
      }

      const ctx = getStudentInvitationNotifyContext(
        { id: stored.id, email: stored.email, details },
        orgId,
      );
      if (ctx) {
        void notifyInvitationStakeholders({
          ...ctx,
          actorId: user.id,
          event: "RESENT",
        });
      }

      return {
        success: true as const,
        message:
          "Invitation renvoyée dans la boîte de réception de l’utilisateur",
      };
    }

    const { token, expiresAt } = await generateInvitationToken();
    const result = await resendInvitation(stored.email, {
      invitationToken: token,
    });
    if (!result.success) return result;

    await updateInvitationToken(stored.id, token, expiresAt, orgId);

    const ctx = getStudentInvitationNotifyContext(
      {
        id: stored.id,
        email: stored.email,
        details: (stored.details as DatabaseInvitationDetails | null) ?? null,
      },
      orgId,
    );
    if (ctx) {
      void notifyInvitationStakeholders({
        ...ctx,
        actorId: user.id,
        event: "RESENT",
      });
    }

    return { success: true as const, message: result.message };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Action serveur pour générer un lien magique
 *
 * Les métadonnées sont déjà persistées dans l'utilisateur Supabase.
 * On génère seulement un nouveau token et on met à jour la table invitation.
 * L'invitation est relue et scopée sur l'organisation courante.
 *
 * @param invitation - L'invitation
 * @returns Résultat avec le lien magique généré
 */
export async function generateMagicLinkAction(
  invitation: InvitationListItem,
) {
  try {
    const user = await getUserInfo();
    const orgId = user?.organization?.id;
    if (!user?.id || !orgId) {
      return { success: false as const, error: "Non authentifié" };
    }

    const stored = await prisma.invitation.findFirst({
      where: { id: invitation.id, orgId, status: "PENDING" },
      select: { id: true, email: true, details: true },
    });
    if (!stored) {
      return {
        success: false as const,
        error: "Invitation introuvable ou déjà traitée",
      };
    }

    const { token, expiresAt } = await generateInvitationToken();
    await updateInvitationToken(stored.id, token, expiresAt, orgId);

    const result = await generateMagicLink(stored.email, {
      invitationToken: token,
    });

    if (result.success) {
      const ctx = getStudentInvitationNotifyContext(
        {
          id: stored.id,
          email: stored.email,
          details: (stored.details as DatabaseInvitationDetails | null) ?? null,
        },
        orgId,
      );
      if (ctx) {
        void notifyInvitationStakeholders({
          ...ctx,
          actorId: user.id,
          event: "LINK_GENERATED",
        });
      }

      return {
        success: true as const,
        message: "Lien magique généré avec succès",
        link: result.link,
      };
    }

    return result;
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Révoque l'invitation et tente de nettoyer un compte Auth non utilisé.
 */
export async function deleteInvitationUserAction(
  invitation: InvitationListItem,
) {
  try {
    const currentUser = await getUserInfo();
    if (!currentUser) {
      return { success: false as const, error: "Non authentifié" };
    }

    const orgId = currentUser.organization?.id;
    if (!orgId) {
      return { success: false as const, error: ERRORS.ORG.NOT_FOUND };
    }

    const usedAt = new Date();
    let updated;
    try {
      updated = await prisma.invitation.update({
        where: {
          id: invitation.id,
          orgId,
          status: "PENDING",
        },
        data: { status: "REVOKED", usedAt },
        select: { id: true, email: true, userId: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return {
          success: false as const,
          error: "Invitation introuvable, déjà acceptée ou déjà révoquée",
        };
      }
      throw error;
    }

    const updatedUserId = updated.userId;
    if (updatedUserId) {
      try {
        await prisma.$transaction((tx) =>
          setInvitationNotificationStatus(tx, {
            userId: updatedUserId,
            invitationId: updated.id,
            status: "REVOKED",
          }),
        );
        await invalidateEvent("NOTIFICATION_READ", updatedUserId);
      } catch (error) {
        console.error(
          "[deleteInvitationUserAction] mise à jour notification échouée",
          error,
        );
      }
    }

    after(async () => {
      try {
        const findResult = await findAuthUserByEmail(updated.email);
        if ("error" in findResult) {
          console.error(
            "[deleteInvitationUserAction] recherche Auth impossible après révocation",
            findResult.error,
          );
          return;
        }

        const authUser = findResult.data.user;
        if (!authUser || authUser.email_confirmed_at) return;

        const [existingUser, otherActiveInvitation] = await Promise.all([
          prisma.user.findFirst({
            where: {
              OR: [
                { id: authUser.id },
                { email: { equals: updated.email, mode: "insensitive" } },
              ],
            },
            select: { id: true },
          }),
          prisma.invitation.findFirst({
            where: {
              id: { not: updated.id },
              email: { equals: updated.email, mode: "insensitive" },
              status: "PENDING",
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: { id: true },
          }),
        ]);

        if (existingUser || otherActiveInvitation) return;

        const deleteResult = await deleteAuthUser(authUser.id);
        if ("error" in deleteResult) {
          console.error(
            "[deleteInvitationUserAction] nettoyage Auth échoué après révocation",
            deleteResult.error,
          );
        }
      } catch (error) {
        console.error(
          "[deleteInvitationUserAction] nettoyage Auth échoué après révocation",
          error,
        );
      }
    });

    return { success: true as const, message: "Invitation révoquée" };
  } catch (error) {
    console.error("[deleteInvitationUserAction] révocation impossible", error);
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de la suppression",
    };
  }
}

export async function getInvitationStatsAction() {
  try {
    const user = await getUserInfo();
    if (!user) {
      return { success: false, error: ERRORS.AUTH };
    }

    const organizationId = user.organization?.id;
    const result = await getInvitationStats(organizationId!);
    return { success: true, stats: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Historique des invitations de l'organisation courante (hub Direction).
 * Retour discriminé `{ data } | { error }` — normalisé côté hook `useOrgInvitations`.
 */
export async function getOrgInvitationsAction({
  limit = 50,
  role,
}: {
  limit?: number;
  role?: Role;
} = {}) {
  try {
    const user = await getUserInfo();
    if (!user) return { error: "Non authentifié" };

    const orgId = user.organization?.id;
    if (!orgId) return { error: "Organisation non trouvée" };

    const data = await getOrganizationInvitations({ orgId, limit, role });
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
