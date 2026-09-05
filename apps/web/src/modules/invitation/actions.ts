//src/modules/invitation/actions.ts
"use server";

import { resendInvitation, generateMagicLink } from "./supabase";
import { getInvitationStats, getOrganizationInvitations, InvitationListItem, updateInvitationToken } from "./database";
import { getUserInfo } from "../user";
import { generateInvitationToken } from "./token";
import { deleteAuthUser, findAuthUserByEmail } from "../auth/supabase";
import { prisma } from "@/lib/prisma";
import { ERRORS } from "@/config";
import { notifyInvitationStakeholders } from "./notifications";
import type { DatabaseInvitationDetails } from "@/types/invitation";
import { Role } from "@/generated/prisma/browser";

function getStudentInvitationNotifyContext(invitation: InvitationListItem, orgId: string) {
  const details = invitation.details as DatabaseInvitationDetails | null;
  if (details?.role !== "STUDENT") {
    return null;
  }
  const raw = invitation.details as Record<string, unknown> | null;
  const enrollment = raw?.enrollment as { classId?: string } | undefined;
  return {
    invitationId: invitation.id,
    orgId,
    invitedEmail: invitation.email,
    classId: enrollment?.classId,
  };
}

export type InvitationActionResult = 
  | { success: true; message: string; link?: string }
  | { success: false; error: string; link?: never };

/**
 * Action serveur pour renvoyer une invitation
 * 
 * Les métadonnées sont déjà persistées dans l'utilisateur Supabase.
 * On génère seulement un nouveau token et on met à jour la table invitation.
 * On ajoute resendLinkBy pour tracer qui a renvoyé le lien.
 * 
 * @param invitation - L'invitation à renvoyer
 * @returns Résultat de l'opération
 */
export async function resendInvitationAction(
  invitation: InvitationListItem
): Promise<InvitationActionResult> {
  try {
    const user = await getUserInfo();
    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    // Générer un nouveau token (les métadonnées sont déjà dans Supabase)
    const { token, expiresAt } = await generateInvitationToken();

    // Mettre à jour le token dans la table invitation
    await updateInvitationToken(invitation.id, token, expiresAt);

    // Envoyer l'invitation et inclure le NOUVEAU token pour mettre à jour les métadonnées Supabase
    const result = await resendInvitation(invitation.email, {
      resendLinkBy: user.id,
      invitationToken: token,
    });
    
    if (!result.success) {
      return result;
    }

    const orgId = user.organization?.id;
    const ctx = orgId ? getStudentInvitationNotifyContext(invitation, orgId) : null;
    if (ctx && user.id) {
      void notifyInvitationStakeholders({
        ...ctx,
        actorId: user.id,
        event: "RESENT",
      });
    }

    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Action serveur pour générer un lien magique
 * 
 * Les métadonnées sont déjà persistées dans l'utilisateur Supabase.
 * On génère seulement un nouveau token et on met à jour la table invitation.
 * On ajoute resendLinkBy pour tracer qui a généré le lien.
 * 
 * @param invitation - L'invitation
 * @returns Résultat avec le lien magique généré
 */
export async function generateMagicLinkAction(
  invitation: InvitationListItem
): Promise<InvitationActionResult> {
  try {
    const user = await getUserInfo();
    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    // Générer un nouveau token (les métadonnées sont déjà dans Supabase)
    const { token, expiresAt } = await generateInvitationToken();

    // Mettre à jour le token dans la table invitation
    await updateInvitationToken(invitation.id, token, expiresAt, user?.id);

    // Générer le lien magique et inclure le NOUVEAU token pour mettre à jour les métadonnées Supabase
    const result = await generateMagicLink(invitation.email, {
      resendLinkBy: user?.id,
      invitationToken: token,
    });
    
    if (result.success) {
      const orgId = user.organization?.id;
      const ctx = orgId ? getStudentInvitationNotifyContext(invitation, orgId) : null;
      if (ctx && user.id) {
        void notifyInvitationStakeholders({
          ...ctx,
          actorId: user.id,
          event: "LINK_GENERATED",
        });
      }

      return { success: true, message: "Lien magique généré avec succès", link: result.link };
    }

    // TypeScript sait que result.success est false ici
    const errorResult = result as { success: false; error: string };
    return { success: false, error: errorResult.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}


/**
 * Supprime un utilisateur Supabase et son invitation s'il n'existe pas dans Prisma
 * 
 * @param invitation - L'invitation contenant l'email de l'utilisateur à supprimer
 * @returns Résultat de l'opération
 */
export async function deleteInvitationUserAction(
  invitation: InvitationListItem
): Promise<InvitationActionResult> {
  try {
    const currentUser = await getUserInfo();
    if (!currentUser) {
      return { success: false, error: "Non authentifié" };
    }

    // Trouver l'utilisateur Supabase par email
    const findResult = await findAuthUserByEmail(invitation.email);
    if ('error' in findResult) {
      return { success: false, error: findResult.error ?? 'Erreur inconnue' };
    }
    const authUser = findResult.data.user;

    // Si l'utilisateur n'existe pas dans Supabase, on supprime juste l'invitation
    if (!authUser) {
      await prisma.invitation.delete({
        where: { id: invitation.id }
      });
      return { success: true, message: "Invitation supprimée (utilisateur Supabase non trouvé)" };
    }

    // Vérifier si l'utilisateur existe dans la table User (Prisma)
    const existingUser = await prisma.user.findFirst({
      where: { email: invitation.email }
    });

    // Si l'utilisateur n'existe pas dans Prisma, on peut le supprimer de Supabase
    if (!existingUser) {
      // Supprimer l'utilisateur de Supabase
      const deleteResult = await deleteAuthUser(authUser.id);
      if ('error' in deleteResult) {
        return { success: false, error: deleteResult.error ?? 'Erreur inconnue' };
      }

      // Supprimer l'invitation
      await prisma.invitation.delete({
        where: { id: invitation.id }
      });

      return { success: true, message: "Utilisateur et invitation supprimés avec succès" };
    }

    // Si l'utilisateur existe dans Prisma, on ne peut pas le supprimer
    return { 
      success: false, 
      error: "Impossible de supprimer : l'utilisateur existe déjà dans la base de données" 
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la suppression",
    };
  }
}



export async function getInvitationStatsAction (){
  try {
    const user = await getUserInfo();
    if (!user) {
      return { success: false, error: ERRORS.AUTH };
    }

    const organizationId = user.organization?.id;
    const result = await getInvitationStats(organizationId!);
    return { success: true, stats: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Historique des invitations de l'organisation courante (hub Direction).
 * Retour discriminé `{ data } | { error }` — normalisé côté hook `useOrgInvitations`.
 */
export async function getOrgInvitationsAction({
  limit = 50,
  role,
}: {
  limit?: number;
  role?: Role;
} = {}) {
  try {
    const user = await getUserInfo();
    if (!user) return { error: "Non authentifié" };

    const orgId = user.organization?.id;
    if (!orgId) return { error: "Organisation non trouvée" };

    const data = await getOrganizationInvitations({ orgId, limit, role });
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
