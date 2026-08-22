// ==========================================
// actions/invite-user.ts
// ==========================================
"use server";

import { InvitationParams, InvitationResult } from "@/types/invitation";
import { getUserInfo } from "../user";
import { generateInvitationToken } from "./token";
import { generateInvitationMetadata } from "./metadata";
import { sendSupabaseInvitation } from "./invitation";
import { createInvitationLink } from "./supabase";
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
    // 4. Vérification du statut (Profil existant ou Nouveau)
    // ---------------------------------------------------------
    const existingProfile = await prisma.user.findUnique({
      where: { email: params.email }
    });
    const userStatus: UserStatus = existingProfile ? "ACTIVE" : "NEW";

    // ---------------------------------------------------------
    // 5. Construction du Payload (Métadonnées)
    // ---------------------------------------------------------
    // Agrégation des données de l'invitation (rôle, fonction admin, etc.)
    // avec les informations de l'émetteur, le token et le statut.
    const metadata = generateInvitationMetadata(
      { ...params, function: params.adminFunction },
      user,
      token,
      userStatus
    );

    // ---------------------------------------------------------
    // 5. Interface avec le fournisseur d'identité (Supabase)
    // ---------------------------------------------------------
    // Deux modes de remise, choisis par l'appelant (défaut = "email", comportement inchangé) :
    // - "email" : Supabase envoie lui-même l'email d'invitation (sendSupabaseInvitation).
    // - "link"  : on crée l'utilisateur (état invited) et on récupère le lien nous-mêmes,
    //             sans email Supabase — à charge de l'appelant de le transmettre
    //             (copier/coller dans l'UI, SMS, notre propre provider d'email, etc.)
    // Si cette étape échoue (ex: email invalide, déjà confirmé, erreur réseau), on annule le flux.
    const deliveryMethod = params.deliveryMethod ?? "email";
    let invitationLink: string | undefined;

    if (deliveryMethod === "link") {
      const linkResult = await createInvitationLink(params.email, metadata);
      if (!linkResult.success) {
        return { error: linkResult.error || "Erreur Supabase" };
      }
      invitationLink = linkResult.link;
    } else {
      const invitationResult = await sendSupabaseInvitation(params.email, metadata);
      if (!invitationResult.success) {
        return { error: invitationResult.error || "Erreur Supabase" };
      }
    }

    // ---------------------------------------------------------
    // 6. Persistance et Traçabilité (MISE À JOUR MAJEURE)
    // ---------------------------------------------------------
    // Enregistrement de l'invitation dans la base de données (Prisma)
    // et création d'une entrée dans l'Audit Log (Action.CREATE).
    const result = await saveInvitationWithAudit(
      params.email,
      token,
      expiresAt,
      metadata,
      user.id!,
      Action.CREATE,
      params.resourceId,   // <-- Ajout : ID de la ressource cible
      params.resourceType, // <-- Ajout : Type de la ressource (ex: 'DEPARTMENT', 'CLASS')
    );

    // Logging serveur pour le monitoring (sans exposer de données sensibles en prod)
    console.log(deliveryMethod === "link" ? "✅ Lien d'invitation généré:" : "✅ Invitation envoyée avec succès:", {
      email: result.invitation.email,
      token: result.invitation.token,
    });

    // ---------------------------------------------------------
    // 7. Retour d'état au client
    // ---------------------------------------------------------
    return {
      data: {
        success: true,
        message:
          deliveryMethod === "link"
            ? `Lien d'invitation généré pour ${params.email}`
            : `Invitation envoyée à ${params.email}`,
        metadata,
        ...(invitationLink ? { link: invitationLink } : {}),
      }
    };

  } catch (error) {
    // Capture globale des exceptions (ex: erreur Prisma, timeout)
    console.error("Invitation error:", error);
    return {
      error: "Erreur lors du traitement de l'invitation",
    };
  }
}