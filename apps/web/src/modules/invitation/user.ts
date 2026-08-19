// ==========================================
// actions/invite-user.ts
// ==========================================
"use server";

import { InvitationParams, InvitationResult } from "@/types/invitation";
import { getUserInfo } from "../user";
import { generateInvitationToken } from "./token";
import { generateInvitationMetadata } from "./metadata";
import { sendSupabaseInvitation } from "./invitation";
import { saveInvitationWithAudit } from "./database";
import { Action } from "@/generated/prisma/browser";
import { getAuthorization } from "../auth/persmission";
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
    // 4. Construction du Payload (Métadonnées)
    // ---------------------------------------------------------
    // Agrégation des données de l'invitation (rôle, fonction admin, etc.)
    // avec les informations de l'émetteur et le token. Ce payload sera 
    // injecté dans Supabase et potentiellement dans l'email.
    const metadata = generateInvitationMetadata(
      { ...params, function: params.adminFunction },
      user,
      token
    );

    // ---------------------------------------------------------
    // 5. Interface avec le fournisseur d'identité (Supabase)
    // ---------------------------------------------------------
    // Déclenche l'envoi effectif de l'invitation via l'API Supabase Auth.
    // Si cette étape échoue (ex: email invalide, erreur réseau), on annule le flux.
    const invitationResult = await sendSupabaseInvitation(params.email, metadata);
    if (!invitationResult.success) {
      return { error: invitationResult.error || "Erreur Supabase" };
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
    console.log("✅ Invitation envoyée avec succès:", {
      email: result.invitation.email,
      token: result.invitation.token,
    });

    // ---------------------------------------------------------
    // 7. Retour d'état au client
    // ---------------------------------------------------------
    return {
      data: {
        success: true,
        message: `Invitation envoyée à ${params.email}`,
        metadata,
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