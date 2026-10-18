verifier la pertinance avant d appliquer :

//apps\web\src\modules\invitation\supabase.ts
import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { INVITE_URL } from "@/config/url";
import { createClient } from "@/utils/supabase/server";
import { USER_METADATA_KEYS, type UserMetadataPatch } from "@/types/user";
import type { InvitationMetadata } from "@/types/invitation";
import { updateUserMetadata } from "@/modules/user/admin";
import { findAuthUserByEmail } from "../auth/supabase";

//supabase documentation url
export const docUrl = "https://supabase.com/docs/reference/javascript";

type InviteMetadataInput =
  | InvitationMetadata
  | { invitationToken?: string; resendLinkBy?: string };

/**
 * Extrait d'une invitation les seules clés de PROFIL (`USER_METADATA_KEYS`)
 * destinées à `user_metadata` : name, invited_by, invitationToken, invitationType.
 *
 * Les clés d'accès (role, function, status, organization(s)) et le reste
 * (invitationStatus, details, resendLinkBy) sont volontairement écartés :
 * l'accès est posé à l'acceptation, depuis la ligne `Invitation` en base.
 */
function pickInviteUserMetadata(metadata?: InviteMetadataInput): UserMetadataPatch {
  if (!metadata) return {};
  const source = metadata as Record<string, unknown>;

  return Object.fromEntries(
    USER_METADATA_KEYS
      .filter((key) => source[key] !== undefined)
      .map((key) => [key, source[key]]),
  ) as UserMetadataPatch;
}

/**
 * Persiste les metadata de profil d'une invitation sur un utilisateur EXISTANT
 * (`data` n'est honoré qu'à la création d'un user).
 *
 * Retourne `{ error }` : un token non écrit rendrait le lien envoyé inutilisable,
 * l'appelant doit donc échouer au lieu de continuer.
 */
async function saveInviteMetadata(user: SupabaseUser, metadata: InviteMetadataInput) {
  // TODO(étape 0) : si updateUserById fusionne user_metadata, supprimer `...user.user_metadata`
  return updateUserMetadata(user.id, {
    ...user.user_metadata,
    ...pickInviteUserMetadata(metadata),
  });
}

/**
 * Renvoie une invitation par email si possible
 *
 * @description
 * - Si l'utilisateur n'existe pas → envoie une nouvelle invitation
 * - Si l'utilisateur existe mais n'est pas confirmé → renvoie l'invitation
 * - Si l'utilisateur est déjà confirmé → retourne une erreur (utiliser generateMagicLink à la place)
 *
 * @param email - Email de l'utilisateur à inviter
 * @param metadata - Métadonnées de l'invitation (optionnel, pour renvoyer avec les mêmes infos).
 *   Seules les clés de profil sont écrites dans `user_metadata`.
 * @returns Message de succès ou erreur
 *
 * @example
 * const result = await resendInvitation("user@example.com", metadata);
 */
export async function resendInvitation(
  email: string,
  metadata?: InviteMetadataInput
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const data = pickInviteUserMetadata(metadata);

    // findAuthUserByEmail : même helper que deleteInvitationUserAction.
    // Recherche indisponible → on traite comme un nouvel utilisateur et on tente l'envoi.
    const findResult = await findAuthUserByEmail(email);
    const user = 'error' in findResult ? null : findResult.data.user;

    if (!user) {
      // Nouvel utilisateur → invitation automatique (data honoré : c'est une création)
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: "Invitation envoyée automatiquement" };
    }

    if (!user.email_confirmed_at) {
      // Utilisateur EXISTANT non confirmé : inviteUserByEmail ignore silencieusement `data`
      // pour un utilisateur déjà créé. On écrit donc nous-mêmes le profil de l'invitation.
      if (metadata) {
        const { error: updateError } = await saveInviteMetadata(user, metadata);
        if (updateError) {
          return { success: false, error: updateError };
        }
      }

      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data,
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
 * @param metadata - Métadonnées optionnelles (seules les clés de profil sont écrites)
 * @returns Le lien magique généré
 *
 * @example
 * const { link } = await generateMagicLink("user@example.com");
 * // Copier le lien et le partager manuellement
 */
export async function generateMagicLink(
  email: string,
  metadata?: InviteMetadataInput
): Promise<{ success: true; link: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    // generateLink() n'honore `data` qu'à la CRÉATION du user. Pour un utilisateur déjà
    // existant (cas normal : on régénère un lien pour un compte invité), on persiste
    // nous-mêmes le profil avant d'appeler generateLink — sinon le nouveau token est
    // silencieusement ignoré et le lien renvoyé reste basé sur l'ancien.
    if (metadata) {
      const findResult = await findAuthUserByEmail(email);
      const user = 'error' in findResult ? null : findResult.data.user;

      if (user) {
        const { error: updateError } = await saveInviteMetadata(user, metadata);
        if (updateError) {
          return { success: false, error: updateError };
        }
      }
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: INVITE_URL,
        data: pickInviteUserMetadata(metadata),
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
 * @param metadata - Métadonnées de l'invitation. Seules les clés de profil (name, invited_by,
 *   invitationToken, invitationType) vont dans `user_metadata` ; l'accès (role, organization...)
 *   est posé à l'acceptation depuis la ligne `Invitation`.
 * @returns Le lien d'invitation à transmettre manuellement, et l'id Supabase créé
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
        data: pickInviteUserMetadata(metadata),
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

// getInvitationsByToken / ByUser / ByOrganization / ByEmail : inchangés