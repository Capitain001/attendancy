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
  
  
  