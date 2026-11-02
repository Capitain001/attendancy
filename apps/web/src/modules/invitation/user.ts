// ==========================================
// actions/invite-user.ts
// ==========================================
"use server";

import { InvitationParams, InvitationResult } from "@/types/invitation";
import { getUserInfo } from "../user";
import { generateInvitationToken } from "./token";
import { generateInvitationMetadata } from "./metadata";
import { sendSupabaseInvitation } from "./invitation";
import { createInvitationLink, generateMagicLink } from "./supabase";
import { saveInvitationWithAudit } from "./database";
import { Action } from "@/generated/prisma/browser";
import { getAuthorization } from "../auth/persmission";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/types";
// : Promise<InvitationResult>

export async function inviteUser(params: InvitationParams) {
  try {
    // ---------------------------------------------------------
    // 1. Validation de l'identité (Authentification)
    // ---------------------------------------------------------
    // Récupération de la session utilisateur active côté serveur.
    // Rejette l'action immédiatement si l'émetteur n'est pas connecté.
    const user = await getUserInfo();
    if (!user) {
      return { error: "Non authentifié" };
    }

    // ---------------------------------------------------------
    // 2. Contrôle d'accès basé sur les rôles (RBAC)
    // ---------------------------------------------------------
    // Vérifie que l'utilisateur possède au moins le rôle DIRECTION ou TEACHER
    // pour avoir le droit d'émettre des invitations.
    const authCheck = await getAuthorization(user, ["DIRECTION", "TEACHER"]);
    if (authCheck.error) {
      return { error: authCheck.error };
    }

    // ---------------------------------------------------------
    // 3. Génération des credentials temporaires
    // ---------------------------------------------------------
    // Création d'un token cryptographique unique et calcul de sa 
    // date d'expiration en fonction des paramètres reçus.
    const { token, expiresAt } = await generateInvitationToken(params.expiresInDays);

    // ---------------------------------------------------------
    // 4. Vérification du statut (Utilisateur existant ou Nouveau)
    // ---------------------------------------------------------
    const existingUser = await prisma.user.findUnique({
      where: { email: params.email },
      select: { id: true },
    });
    const userStatus: UserStatus = existingUser ? "ACTIVE" : "NEW";

    // ---------------------------------------------------------
    // 5. Construction du Payload (Métadonnées)
    // ---------------------------------------------------------
    // Agrégation des données de l'invitation (rôle, fonction admin, etc.)
    // avec les informations de l'émetteur, le token et le statut.
    const metadata = generateInvitationMetadata(
      { ...params, function: params.adminFunction },
      user,
      token,
      userStatus,
    );

    // ---------------------------------------------------------
    // 6. Interface avec le fournisseur d'identité (Supabase)
    // ---------------------------------------------------------
    // Deux modes de remise, choisis par l'appelant (défaut = "email", comportement inchangé) :
    // - "link"  : lien magique si utilisateur existant, lien d'invitation sinon.
    // - "email" : si nouvel utilisateur, envoi par Supabase (sendSupabaseInvitation).
    //             si utilisateur existant, aucun appel Supabase : la remise est la notification in-app (étape 7).
    const deliveryMethod = params.deliveryMethod ?? "email";
    let invitationLink: string | undefined;

    if (deliveryMethod === "link") {
      const linkResult = existingUser
        ? await generateMagicLink(params.email, metadata)
        : await createInvitationLink(params.email, metadata);
      if (!linkResult.success) {
        return { error: linkResult.error || "Erreur Supabase" };
      }
      invitationLink = linkResult.link;
    } else if (!existingUser) {
      const invitationResult = await sendSupabaseInvitation(params.email, metadata);
      if (!invitationResult.success) {
        return { error: invitationResult.error || "Erreur Supabase" };
      }
    }

    // ---------------------------------------------------------
    // 7. Persistance atomique (Invitation + AuditLog + Notification si existant)
    // ---------------------------------------------------------
    const result = await saveInvitationWithAudit({
      email: params.email,
      token,
      expiresAt,
      metadata,
      inviterUserId: user.id!,
      action: Action.CREATE,
      resourceId: params.resourceId,
      resourceType: params.resourceType,
      targetUserId: existingUser?.id,
    });

    console.log(deliveryMethod === "link" ? "✅ Lien d'invitation généré:" : "✅ Invitation enregistrée:", {
      email: result.invitation.email,
      invitationId: result.invitation.id,
    });

    // ---------------------------------------------------------
    // 8. Retour d'état au client
    // ---------------------------------------------------------
    const inboxOnly = !!existingUser && deliveryMethod === "email";
    return {
      data: {
        success: true,
        message:
          deliveryMethod === "link"
            ? `Lien d'invitation généré pour ${params.email}`
            : inboxOnly
              ? `Invitation déposée dans la boîte de réception de ${params.email}`
              : `Invitation envoyée à ${params.email}`,
        metadata,
        ...(invitationLink ? { link: invitationLink } : {}),
      },
    };

  } catch (error) {
    // Capture globale des exceptions (ex: erreur Prisma, timeout)
    console.error("Invitation error:", error);
    return {
      error: "Erreur lors du traitement de l'invitation",
    };
  }
}
