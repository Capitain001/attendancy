"use server";

import { Action, Resource, Role } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { getUserInfo } from '@/modules/user';
import { syncUserOrganizationProfile } from "@/modules/user/update";


import {
  assignFunctionToUser,
  assignMultipleFunctionsToUser,
  createRoleSpecificEntity,
} from "./utils";
import { logAuditAsync } from "@/utils/server";
import { DatabaseInvitationDetails } from "@/types/invitation";

/* =========================
   TYPES
========================= */

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type InvitationRecord = Awaited<ReturnType<typeof fetchAndValidateInvitation>>;

/* =========================
   HELPERS
========================= */

async function fetchAndValidateInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      details: true,
      orgId: true,
      usedAt: true,
      expiresAt: true,
    },
  });

  if (!invitation) throw new Error("Invitation non trouvée");
  if (invitation.usedAt) throw new Error("Cette invitation a déjà été utilisée");
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw new Error("Cette invitation a expiré");
  }

  return invitation;
}

function extractInvitationContext(invitation: InvitationRecord) {
  const details = invitation.details as DatabaseInvitationDetails;

  return {
    details,
    orgId: invitation.orgId,
    role: (details.role ?? "STUDENT") as Role,
    firstName: details.name?.split(" ")[0] || invitation.email.split("@")[0],
    lastName: details.name?.split(" ").slice(1).join(" ") || "",
    departmentId: details.organization?.departmentId,
  };
}

async function createUserInOrganization(
  tx: TransactionClient,
  params: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    orgId: string;
    role: Role;
    departmentId?: string;
  }
) {
  // tx.user.upsert
  const createdUser = await tx.user.upsert({
    where: { id: params.userId },
    create: {
      id: params.userId,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      status: "ACTIVE",
    },
    update: {}, // Ne rien mettre à jour si l'utilisateur existe déjà
  });

  // 2. Rattacher l'utilisateur à l'organisation
  await tx.userOrganization.create({
    data: {
      userId: createdUser.id,
      orgId: params.orgId,
      role: params.role,
      isMainOrg: false,
      isResponsable: false,
    },
  });

  // 3. Créer l'entité métier selon le rôle (Student, Teacher, Parent, etc.)
  const profile = await createRoleSpecificEntity(
    tx,
    createdUser.id,
    params.role,
    params.orgId,
    params.departmentId
  );

  return { createdUser, profile };
}

async function assignUserFunctions(
  tx: TransactionClient,
  params: {
    userId: string;
    orgId: string;
    details: DatabaseInvitationDetails;
  }
) {
  // 1. Assigner la fonction principale
  await assignFunctionToUser(
    tx,
    params.userId,
    params.orgId,
    params.details.function,
    params.details.invited_by?.id
  );

  // 2. Assigner les fonctions supplémentaires pour la direction
  const additionalFunctions = params.details.additionalFunctions;
  if (
    params.details.role === "DIRECTION" &&
    Array.isArray(additionalFunctions) &&
    additionalFunctions.length > 0
  ) {
    await assignMultipleFunctionsToUser(
      tx,
      params.userId,
      params.orgId,
      additionalFunctions,
      params.details.invited_by?.id
    );
  }
}

// ✅ CHANGÉ: logAudit → logAuditAsync (asynchrone)
function logSignupAudit(params: {
  userId: string;
  invitationId: string;
  invitationEmail: string;
  orgId: string;
  details: DatabaseInvitationDetails;
  departmentId?: string;
}) {
  logAuditAsync({
    userId: params.userId,
    action: Action.CREATE, // ou "CREATE" si le type l'accepte
    resource: Resource.USER, // ou "USER" si le type l'accepte
    resourceId: params.invitationId,
    orgId: params.orgId, // ✅ CHANGÉ: ajout de orgId
    details: {
      email: params.invitationEmail,
      name: params.details.name,
      role: params.details.role,
      function: params.details.function,
      departmentId: params.departmentId,
      invited_by: params.details.invited_by,
      invitationId: params.invitationId,
      action_type: "ACCEPT_INVITATION",
    },
  });
}

/* =========================
   ACTION
========================= */

// ✅retour { data: {...} } | { error: string }
export async function completeSignup(): Promise<
  { data: { userId: string; profileId: string | undefined } } | { error: string }
> {
  try {
    // 1. Vérifier l'authentification et le token d'invitation
    const user = await getUserInfo();
    if (!user?.id) throw new Error("Utilisateur non authentifié");
    if (!user.invitationToken) throw new Error("Token d'invitation non trouvé");
    const userId = user.id;

    // 2. Valider l'invitation en base
    const invitation = await fetchAndValidateInvitation(user.invitationToken);
    const { details, orgId, role, firstName, lastName, departmentId } =
      extractInvitationContext(invitation);

    const { profileId, createdUserId } = await prisma.$transaction(async (tx) => {
      // 3. Créer l'utilisateur et son entité métier
      const { createdUser, profile } = await createUserInOrganization(tx, {
        userId,
        email: invitation.email,
        firstName,
        lastName,
        orgId,
        role,
        departmentId,
      });

      // 4. Assigner les fonctions
      await assignUserFunctions(tx, {
        userId: createdUser.id,
        orgId,
        details,
      });

      // 4.bis Parent externe (P-18 B) : matérialiser le lien parent→étudiant.
      if (role === "PARENT" && details.parentLink?.studentId && profile?.id) {
        await tx.parentRelation.create({
          data: {
            parentId: profile.id,
            studentId: details.parentLink.studentId,
            relation: details.parentLink.relation || "Parent",
            orgId,
          },
        });
      }

      // 5. Marquer l'invitation comme utilisée
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date(), userId: createdUser.id },
      });

      return {
        profileId: profile?.id,
        createdUserId: createdUser.id,
      };
    });

    // 6. Mettre à jour les metadata Supabase avec le profil de rôle
    await syncUserOrganizationProfile({
      orgId,
      role,
      profileId,
      status: "ACTIVE",
    });

    // 7. Logger l'audit — maintenant asynchrone
    logSignupAudit({
      userId: createdUserId,
      invitationId: invitation.id,
      invitationEmail: invitation.email,
      orgId,
      details,
      departmentId,
    });

    // ✅ retour structuré avec data
    return { data: { userId: createdUserId, profileId } };
  } catch (error) {
    console.error("Erreur lors de la finalisation de l'inscription:", error);
    // ✅ retour structuré avec error
    return {
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}