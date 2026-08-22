import { INVITE_URL } from "@/config/url";
import { createClient } from "@/utils/supabase/server";
import { InvitationMetadata } from "@/types/invitation";
import { findAuthUserByEmail } from "../auth/supabase";

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
  metadata?: InvitationMetadata | { invitationToken?: string; resendLinkBy?: string }
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    // findAuthUserByEmail : même helper que deleteInvitationUserAction — évite de
    // rescanner tous les users via listUsers() (paginé, non fiable au-delà de la 1ère page)
    // juste pour trouver un seul email.
    const findResult = await findAuthUserByEmail(email);

    if ('error' in findResult) {
      // Recherche indisponible → on essaie quand même d'envoyer l'invitation
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data: metadata || {},
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, message: "Invitation envoyée automatiquement" };
    }

    const user = findResult.data.user;

    if (!user) {
      // Nouvel utilisateur → invitation automatique (data honoré : c'est une création)
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
      // Utilisateur EXISTANT non confirmé : inviteUserByEmail ignore silencieusement `data`
      // pour un utilisateur déjà créé (data n'est honoré qu'à la création). Il faut donc
      // écrire nous-mêmes le nouveau user_metadata via updateUserById, en mergeant avec
      // l'existant puisque updateUserById REMPLACE tout le user_metadata (pas de merge Supabase).
      if (metadata) {
        const mergedMetadata = { ...(user.user_metadata ?? {}), ...metadata };
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: mergedMetadata,
        });
        if (updateError) {
          return { success: false, error: updateError.message };
        }
      }

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
  metadata?: InvitationMetadata | { invitationToken?: string; resendLinkBy?: string }
): Promise<{ success: true; link: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    // generateLink() n'honore `data` qu'à la CRÉATION du user. Pour un utilisateur déjà
    // existant (cas normal ici : on régénère un lien pour un compte invité), il faut
    // persister nous-mêmes le nouveau user_metadata via updateUserById avant d'appeler
    // generateLink — sinon le nouveau token (et le reste de `metadata`) est silencieusement
    // ignoré et le lien renvoyé reste basé sur l'ancien user_metadata.
    if (metadata) {
      const findResult = await findAuthUserByEmail(email);
      const user = 'error' in findResult ? null : findResult.data.user;

      if (user) {
        const mergedMetadata = { ...(user.user_metadata ?? {}), ...metadata };
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: mergedMetadata,
        });
        if (updateError) {
          return { success: false, error: updateError.message };
        }
      }
    }

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