// ==========================================
// src/modules/invitation/invitation.ts
// ==========================================
/**
 * Service d'envoi d'invitations via Supabase Auth
 * 
 * @description Envoie des invitations par email en utilisant l'API admin de Supabase
 * @example
 * const result = await sendSupabaseInvitation("user@example.com", metadata);
 * if (!result.success) console.error(result.error);
 */

import { InvitationMetadata, SupabaseInviteData } from "@/types/invitation";
import { createClient } from "@/utils/supabase/server";
import { INVITE_URL } from "@/config/url";


function createSupabaseInviteData(metadata: InvitationMetadata): SupabaseInviteData {
  return {
    ...metadata,
  };
}

export async function sendSupabaseInvitation(
  email: string,
  metadata: InvitationMetadata
) {
  const adminClient = await createClient();
  const inviteData = createSupabaseInviteData(metadata);

  const { data: inviteResult, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_URL,
    data: inviteData,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // `data` n'est honoré qu'à la création. Pour un utilisateur déjà existant,
  // on écrit manuellement en app_metadata après l'invite.
  if (inviteResult?.user?.id) {
    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      inviteResult.user.id,
      { app_metadata: inviteData }
    );
    if (metaError) {
      console.warn('[sendSupabaseInvitation] app_metadata non écrit:', metaError.message);
    }
  }

  return { success: true };
}
