// ==========================================
// src/modules/invitation/invitation.ts
// ==========================================
/**
 * Service d'envoi d'invitations via Supabase Auth
 *
 * @description Envoie des invitations par email en utilisant l'API admin de Supabase.
 * Seules les clés de PROFIL (name, invited_by, invitationToken, invitationType) sont
 * transmises dans `user_metadata` ; role, function, status et organisation ne sont jamais
 * envoyés ici : ils sont posés à l'acceptation, depuis la ligne `Invitation` en base.
 * @example
 * const result = await sendSupabaseInvitation("user@example.com", metadata);
 * if (!result.success) console.error(result.error);
 */
import "server-only";

import type { InvitationMetadata } from "@/types/invitation";
import { createClient } from "@/utils/supabase/server";
import { INVITE_URL } from "@/config/url";
import { pickInviteUserMetadata } from "./supabase";

export async function sendSupabaseInvitation(
  email: string,
  metadata: InvitationMetadata
) {
  const adminClient = await createClient();

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_URL,
    data: pickInviteUserMetadata(metadata),
  });

  if (error) {
    // ✅ UTILISATION DU GESTIONNAIRE D'ERREURS
    // return supabaseInvitationError(error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
