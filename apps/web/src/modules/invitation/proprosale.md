Le point clé : generateLink() gère la création de l'utilisateur pour les types signup, invite et magiclink — mais elle n'envoie jamais rien elle-même, contrairement à inviteUserByEmail. Donc generateLink({ type: "invite" }) fait exactement ce que tu demandes en un seul appel : crée l'utilisateur en état invited (non confirmé) et retourne le action_link, à toi de le transmettre par le canal que tu veux (copier/coller, ton propre email, SMS…).

Ce que j'ai ajouté :

createInvitationLink(email, metadata) dans supabase.ts — le pendant "sans email" de sendSupabaseInvitation : même retour {success, error} discriminé, appelle generateLink({type: "invite", ...}), renvoie { link, userId }. Si l'email appartient déjà à un utilisateur confirmé, Supabase renvoie une erreur (même comportement que inviteUserByEmail), donc pas de garde supplémentaire à écrire côté appelant.

inviteUser branché sur params.deliveryMethod ("email" | "link", défaut "email" → comportement actuel inchangé). En mode "link", l'étape 5 appelle createInvitationLink au lieu de sendSupabaseInvitation, et le lien généré remonte dans data.link du retour de l'action — le reste du flux (token custom, saveInvitationWithAudit, audit log) reste identique, puisque ton système de tracking (token/expiresAt en base) est indépendant du mécanisme d'auth Supabase.

À faire de ton côté (je n'ai pas le fichier) : ajouter dans types/invitation.ts :

ts
export interface InvitationParams {
  // ...
  deliveryMethod?: "email" | "link"; // défaut "email"
}

et dans InvitationResult, un link?: string optionnel sur la branche data.

Un point d'attention pour l'UI qui va consommer data.link : ce lien contient un token Supabase à usage unique et à durée de vie courte (OTP expiration, 1h par défaut) — s'il n'est pas récupéré/copié tout de suite, il faudra repasser par generateMagicLink (pas createInvitationLink, sinon vous générez un doublon d'utilisateur invited) pour en régénérer un.

//supabase

import { INVITE_URL } from "@/config/url";
import { createClient } from "@/utils/supabase/server";
import { InvitationMetadata } from "@/types/invitation";

//supabase documentation url
export const docUrl = "https://supabase.com/docs/reference/javascript";

/**
 * Renvoie une invitation par email si possible
 * 
 * @description
 * - Si l'utilisateur n'existe pas → envoie une nouvelle invitation
 * - Si l'utilisateur existe mais n'est pas confirmé → renvoie l'invitation
 * - Si l'utilisateur est déjà confirmé → retourne une erreur (utiliser generateMagicLink à la place)
 * 
 * @param email - Email de l'utilisateur à inviter
 * @param metadata - Métadonnées de l'invitation (optionnel, pour renvoyer avec les mêmes infos)
 * @returns Message de succès ou lien magique
 * @throws Error si l'opération échoue
 * 
 * @example
 * const result = await resendInvitation("user@example.com", metadata);
 */
export async function resendInvitation(
  email: string,
  metadata?: InvitationMetadata | { resendLinkBy?: string }
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur existe en listant les utilisateurs avec cet email
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    
    let user = null;
    if (!listError && data?.users) {
      user = data.users.find((u: any) => u.email === email) || null;
    }
    
    if (listError) {
      // Si on ne peut pas lister, on essaie quand même d'envoyer l'invitation
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data: metadata || {},
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, message: "Invitation envoyée automatiquement" };
    }

    if (!user) {
      // Nouvel utilisateur → invitation automatique
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data: metadata || {},
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, message: "Invitation envoyée automatiquement" };
    }

    if (!user.email_confirmed_at) {
      // Utilisateur non confirmé → on peut renvoyer l'invitation
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data: metadata || {},
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, message: "Invitation renvoyée (non confirmé)" };
    }

    // Utilisateur déjà actif → on ne peut pas renvoyer d'invitation
    return { 
      success: false, 
      error: "L'utilisateur a déjà confirmé son email. Utilisez la génération de lien magique à la place." 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue lors du renvoi de l'invitation" 
    };
  }
}

/**
 * Génère un lien magique à copier manuellement
 * 
 * @description
 * Génère un lien magique qui peut être utilisé pour se connecter sans mot de passe.
 * Ce lien peut être copié et partagé manuellement avec l'utilisateur.
 * 
 * @param email - Email de l'utilisateur
 * @param metadata - Métadonnées optionnelles à inclure dans le lien
 * @returns Le lien magique généré
 * @throws Error si l'opération échoue
 * 
 * @example
 * const { link } = await generateMagicLink("user@example.com");
 * // Copier le lien et le partager manuellement
 */
export async function generateMagicLink(
  email: string,
  metadata?: InvitationMetadata | { resendLinkBy?: string }
): Promise<{ success: true; link: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { 
        redirectTo: INVITE_URL,
        data: metadata ,
      },
    });
    
    if (error) {
      return { success: false, error: error.message };
    }

    const link = data?.properties?.action_link;
    
    if (!link) {
      return { success: false, error: "Le lien magique n'a pas pu être généré" };
    }

    return { success: true, link };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la génération du lien" 
    };
  }
}




/**
 * Crée l'utilisateur (état "invited", non confirmé) et génère son lien d'invitation,
 * SANS déclencher l'email automatique de Supabase.
 *
 * @description
 * - Utilise `generateLink({ type: "invite" })`, qui d'après la doc Supabase
 *   "handles the creation of the user for signup, invite and magiclink" :
 *   contrairement à `inviteUserByEmail`, cet appel ne fait AUCUN envoi — il renvoie
 *   seulement `action_link`, à charge de l'appelant de le transmettre (copier/coller,
 *   SMS, email via notre propre provider, etc.)
 * - Si l'email appartient déjà à un utilisateur confirmé → erreur, comme `inviteUserByEmail`
 *   (dans ce cas, utiliser `generateMagicLink` à la place)
 *
 * @param email - Email de l'utilisateur à créer
 * @param metadata - Métadonnées de l'invitation, stockées dans `user_metadata`
 * @returns Le lien d'invitation à transmettre manuellement, et l'id Supabase créé
 * @throws Error si l'opération échoue
 *
 * @example
 * const result = await createInvitationLink("user@example.com", metadata);
 * if (result.success) {
 *   // result.link → à afficher/copier dans l'UI, ou à envoyer via notre propre canal
 * }
 */
export async function createInvitationLink(
  email: string,
  metadata: InvitationMetadata
): Promise<
  | { success: true; link: string; userId: string }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: INVITE_URL,
        data: metadata,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const link = data?.properties?.action_link;
    const userId = data?.user?.id;

    if (!link || !userId) {
      return { success: false, error: "Le lien d'invitation n'a pas pu être généré" };
    }

    return { success: true, link, userId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la création de l'invitation par lien",
    };
  }
}

/**
 * Fonction utilitaire combinée (ancienne version, conservée pour compatibilité)
 * 
 * @deprecated Utilisez resendInvitation() ou generateMagicLink() à la place
 */
export async function resendInviteOrMagicLink(email: string) {
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur existe en listant les utilisateurs avec cet email
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    
    let user = null;
    if (!listError && data?.users) {
      user = data.users.find((u: any) => u.email === email) || null;
    }
    
    if (listError) throw listError;
  
    if (!user) {
      // Nouvel utilisateur → invitation automatique
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data: { invitedBy: "admin@example.com" },
      });
      if (error) throw error;
      return "Invitation envoyée automatiquement par Supabase";
    }
  
    if (!user?.email_confirmed_at) {
    // Utilisateur non confirmé → on peut renvoyer l'invitation
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data: { invitedBy: "admin@example.com" },
      });
      if (error) throw error;
      return "Invitation renvoyée (non confirmé)";
    }
    
    // Utilisateur déjà actif → on envoie un magic link via generateLink
  const { data: linkData, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: INVITE_URL },
    });
    if (error) throw error;
  
  return linkData?.properties?.action_link; // à envoyer via ton email
  }
  








/* get invitations by token */

  export async function getInvitationsByToken(token: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('Invitation').select('*').eq('token', token);
    if (error) throw error;
    return data;
  }

/* get invitations by user */
export async function getInvitationsByUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('Invitation').select('*').eq('userId', userId);
  if (error) throw error;
  return data;
}






/* get invitations by organization */
export async function getInvitationsByOrganization(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('Invitation').select('*').eq('orgId', organizationId);
  if (error) throw error;
  return data;
}



  /* get invitations by email */
  export async function getInvitationsByEmail(email: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('Invitation').select('*').eq('email', email);
    if (error) throw error;
    return data;
  }

//

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