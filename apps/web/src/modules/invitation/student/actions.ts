// src/modules/invitation/student/actions.ts
"use server";

import { after } from "next/server";
import { inviteUser }                          from "../user";
import { InviteStudentParams, type InviteStudentsBulkResult, type BulkInviteItemSuccess, type BulkInviteItemFailure } from "./types";
import { checkInvitationResources }            from "./database";
import { inviteStudentSchema, inviteStudentsBulkSchema, type InviteStudentsBulkInput } from "./validation";
import { safeParse }                           from "valibot";
import { notifyInvitationStakeholders }        from "../notifications";
import { getAuthorization } from "@/modules/auth";
import { ERRORS } from "@/config";
import { getClassInvitations } from "./database";
import { getUserInfo } from "@/services/user";
import { prisma } from "@/lib/prisma";

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
      resourceName:  check.resourceName,
      deliveryMethod: params.deliveryMethod,
      details: {
        enrollment: {
          classId,
          ...(groupIds?.length ? { groupIds }    : {}),
          ...(parentEmail      ? { parentEmail } : {}),
        },
      },
    });

    if (result.error) {
      return {
        success: false,
        error: result.error || "Échec de l'invitation de l'étudiant",
      };
    }

    // ── 6. Notification ───────────────────────────────────────
    if (result.data?.metadata && currentUser.id) {
      // Retrouve l'invitation créée pour la notification
      const { prisma } = await import("@/lib/prisma");
      const invitation = await prisma.invitation.findFirst({
        where:   { email, orgId, resourceId: classId, status: "PENDING" },
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
          className:    check.resourceName,
        });
      }
    }
    return {
      success: true,
      message: result.data?.link
        ? `Lien d'invitation généré pour ${email}`
        : `Une invitation a été envoyée à ${email} pour s'inscrire en tant qu'étudiant`,
      metadata: result.data?.metadata,
      link: result.data?.link,
    };

  } catch (error) {
    console.error("Erreur lors de l'invitation de l'étudiant:", error);
    return {
      success: false,
      error: "Une erreur inattendue s'est produite lors de l'invitation",
    };
  }
}


const CONCURRENCY = 5;

export async function inviteStudentsAction(
  params: InviteStudentsBulkInput
): Promise<InviteStudentsBulkResult> {
  try {
    // ── 1. Validation Valibot ──────────────────────────────────────────
    const parsed = safeParse(inviteStudentsBulkSchema, params);
    if (!parsed.success) {
      return { error: parsed.issues[0]?.message ?? "Paramètres d'invitation invalides" };
    }
    const { classId, students, groupIds, expiresInDays, deliveryMethod } = parsed.output;

    // ── 2. Authentification & Organisation (1 appel) ──────────────────
    const currentUser = await getUserInfo();
    const orgId = currentUser?.organization?.id;
    if (!currentUser?.id || !orgId) {
      return { error: "Organisation introuvable ou session expirée" };
    }

    // ── 3. Vérification des ressources de classe (1 appel) ─────────────
    const check = await checkInvitationResources({ classId, orgId, groupIds });
    if (!check.valid) {
      return { error: check.error ?? "Ressources invalides" };
    }

    // ── 4. Dédoublonnage mémoire dans le lot ──────────────────────────
    const unique = [...new Map(students.map((s) => [s.email, s])).values()];
    const uniqueEmails = unique.map((s) => s.email);

    // ── 5. Pré-filtrage DB groupé (Inscrits + Invitations en attente) ──
    const [pendingInvitations, existingEnrollments] = await Promise.all([
      prisma.invitation.findMany({
        where: {
          orgId,
          resourceId: classId,
          status: "PENDING",
          email: { in: uniqueEmails, mode: "insensitive" },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { email: true },
      }),
      prisma.studentEnrollment.findMany({
        where: {
          classId,
          endedAt: null,
          student: {
            user: { email: { in: uniqueEmails, mode: "insensitive" } },
          },
        },
        select: {
          student: {
            select: { user: { select: { email: true } } },
          },
        },
      }),
    ]);

    const pendingSet = new Set(pendingInvitations.map((p) => p.email.toLowerCase()));
    const enrolledSet = new Set(
      existingEnrollments.map((e) => e.student.user.email.toLowerCase())
    );

    const succeeded: BulkInviteItemSuccess[] = [];
    const failed: BulkInviteItemFailure[] = [];

    const toSend = unique.filter((s) => {
      const emailLower = s.email.toLowerCase();
      if (enrolledSet.has(emailLower)) {
        failed.push({ email: s.email, error: "Étudiant déjà inscrit dans cette classe" });
        return false;
      }
      if (pendingSet.has(emailLower)) {
        failed.push({ email: s.email, error: "Invitation déjà en attente pour cette classe" });
        return false;
      }
      return true;
    });

    // ── 6. Traitement par Chunks (Pool safe) ───────────────────────────
    for (let i = 0; i < toSend.length; i += CONCURRENCY) {
      const chunk = toSend.slice(i, i + CONCURRENCY);

      const settled = await Promise.allSettled(
        chunk.map((s) =>
          inviteUser({
            email: s.email,
            name: [s.firstName, s.lastName].filter(Boolean).join(" ") || undefined,
            role: "STUDENT",
            expiresInDays: expiresInDays ?? 7,
            resourceId: classId,
            resourceType: "CLASS",
            resourceName: check.resourceName,
            deliveryMethod,
            details: {
              enrollment: {
                classId,
                ...(groupIds?.length ? { groupIds } : {}),
                ...(s.parentEmail ? { parentEmail: s.parentEmail } : {}),
              },
            },
          })
        )
      );

      settled.forEach((r, idx) => {
        const student = chunk[idx];
        if (r.status === "fulfilled" && !r.value.error && r.value.data) {
          succeeded.push({
            email: student.email,
            invitationId: r.value.data.invitationId,
            link: r.value.data.link,
          });
        } else {
          if (r.status === "rejected") {
            console.error("[bulk invite] rejet", { email: student.email, reason: r.reason });
          }
          failed.push({
            email: student.email,
            error:
              r.status === "fulfilled"
                ? r.value.error ?? "Échec de l'envoi"
                : "Erreur serveur inattendue",
          });
        }
      });
    }

    // ── 7. Tâche d'arrière-plan (Notifications non bloquantes) ──────────
    const actorId = currentUser.id;
    if (succeeded.length > 0) {
      after(async () => {
        await Promise.allSettled(
          succeeded
            .filter((s) => s.invitationId)
            .map((s) =>
              notifyInvitationStakeholders({
                invitationId: s.invitationId!,
                orgId,
                actorId,
                event: "CREATED",
                invitedEmail: s.email,
                classId,
                className: check.resourceName,
              })
            )
        );
      });
    }

    // ── 8. Réponse normalisée (ActionResponse) ─────────────────────────
    return {
      data: {
        status: failed.length === 0 ? "ok" : succeeded.length === 0 ? "failed" : "partial",
        total: unique.length,
        succeeded,
        failed,
      },
    };
  } catch (error) {
    console.error("inviteStudentsAction error:", error);
    return { error: "Une erreur inattendue s'est produite lors du traitement du lot" };
  }
}




export async function getClassInvitationsAction({ classId }: { classId: string }) {
  try {
    const { getUserInfo } = await import("@/services/user");
    const user = await getUserInfo();

    if (!user) throw new Error(ERRORS.AUTH.UNAUTHORIZED);
    const orgId = user?.organization?.id;
    if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND);

    const auth = user.role === "TEACHER" && user.organization?.type === "PERSONAL"
      ? getAuthorization(user, "TEACHER", undefined, { allowPersonalOrg: true })
      : getAuthorization(user, "DIRECTION", "PRINCIPAL");
    if (auth.error) throw new Error(auth.error);


    const data = await getClassInvitations(classId, orgId);

    return { data };
  } catch (error) {
    console.error("getClassInvitationsAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}