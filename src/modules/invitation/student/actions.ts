// src/services/invitation/student/actions.ts
"use server";

import { inviteUser }                          from "../user";
import { InviteStudentParams }                 from "./types";
import { checkInvitationResources }            from "./database";
import { inviteStudentSchema }                 from "./validation";
import { safeParse }                           from "valibot";
import { notifyInvitationStakeholders }        from "../notifications";
import { getAuthorization } from "@/modules/auth";
import { ERRORS } from "@/config";
import { getClassInvitations } from "./database";

/**
 * Invite un étudiant dans l'organisation.
 *
 * Flux :
 * 1. Validation Valibot des paramètres
 * 2. Récupération de l'organisation courante
 * 3. Vérification des ressources (classe + groupes)
 * 4. Création de l'invitation via inviteUser
 *    → resourceId: classId + resourceType: "CLASS" stockés directement en DB
 *    → enrollment (groupIds, parentEmail) stocké dans details si nécessaire
 */
export async function inviteStudent(params: InviteStudentParams) {
  try {
    // ── 1. Validation des paramètres ──────────────────────────
    const validationResult = safeParse(inviteStudentSchema, params);

    if (!validationResult.success) {
      const firstError = validationResult.issues[0];
      return {
        success: false,
        error: firstError?.message || "Paramètres d'invitation invalides",
      };
    }

    const {
      email,
      firstName,
      lastName,
      classId,
      groupIds,
      parentEmail,
      expiresInDays,
    } = validationResult.output;

    // ── 2. Organisation courante ──────────────────────────────
    const { getUserInfo } = await import("@/services/user");
    const currentUser = await getUserInfo();

    if (!currentUser?.organization?.id) {
      return {
        success: false,
        error: "Organisation non trouvée. Vous devez être associé à une organisation.",
      };
    }

    const orgId = currentUser.organization.id;

    // ── 3. Vérification des ressources ────────────────────────
    const check = await checkInvitationResources({ classId, orgId, groupIds });
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    // ── 4. Construction du nom complet ────────────────────────
    const name =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName || lastName || undefined;

    // ── 5. Création de l'invitation ───────────────────────────
    // classId → resourceId + resourceType: "CLASS" stockés directement en DB
    // enrollment (groupIds, parentEmail) dans details pour l'acceptation
    const result = await inviteUser({
      email,
      name,
      role:          "STUDENT",
      expiresInDays: expiresInDays ?? 7,
      resourceId:    classId,
      resourceType:  "CLASS",
      ...(groupIds?.length || parentEmail
        ? {
            details: {
              enrollment: {
                classId,
                ...(groupIds?.length ? { groupIds }    : {}),
                ...(parentEmail      ? { parentEmail } : {}),
              },
            },
          }
        : {}),
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Échec de l'invitation de l'étudiant",
      };
    }

    // ── 6. Notification ───────────────────────────────────────
    if (result.metadata && currentUser.id) {
      // Retrouve l'invitation créée pour la notification
      const { prisma } = await import("@/lib/prisma");
      const invitation = await prisma.invitation.findFirst({
        where:   { email, orgId, resourceId: classId, usedAt: null },
        select:  { id: true },
        orderBy: { createdAt: "desc" },
      });

      if (invitation) {
        void notifyInvitationStakeholders({
          invitationId: invitation.id,
          orgId,
          actorId:      currentUser.id,
          event:        "CREATED",
          invitedEmail: email,
          classId,
        });
      }
    }

    return {
      success: true,
      message: `Une invitation a été envoyée à ${email} pour s'inscrire en tant qu'étudiant`,
      metadata: result.metadata,
    };

  } catch (error) {
    console.error("Erreur lors de l'invitation de l'étudiant:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite lors de l'invitation",
    };
  }
}

export async function getClassInvitationsAction({ classId }: { classId: string }) {
  try {
    const { getUserInfo } = await import("@/services/user");
    const user = await getUserInfo();

    if (!user) throw new Error(ERRORS.AUTH.UNAUTHORIZED);
    const orgId = user?.organization?.id;
    if (!orgId) throw new Error("Organisation non trouvée");

    const auth = await getAuthorization(user, "DIRECTION", "PRINCIPAL");
    if (auth.success === false) throw new Error(auth.error);


    const data = await getClassInvitations(classId, orgId);

    return { data };
  } catch (error) {
    console.error("getClassInvitationsAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}