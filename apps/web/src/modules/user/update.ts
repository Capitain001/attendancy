// src/modules/user/update.ts
// Écritures de profil (user_metadata). Module serveur uniquement.
// Pour les clés d'accès (role, status, organization...), voir access.ts.

import "server-only";

import {
  USER_METADATA_KEYS,
  type UserMetadata,
  type UserMetadataPatch,
} from "@/types/user";
import { createClient } from "@/utils/supabase/server";

import { getUserInfo } from "./userInfo";
import { CacheInvalidation } from "./cache/operations";

/* =========================
   CACHE
========================= */

async function refreshCurrentUserCache() {
  await getUserInfo({ refresh: true });
}

/* =========================
   UTILISATEUR COURANT
========================= */

/**
 * Réinitialise les `user_metadata` de PROFIL de l'utilisateur courant (client admin).
 *
 * Le merge Supabase étant superficiel (clés absentes conservées), un simple appel
 * à `updateUserById` ne supprime rien. Cette fonction met donc à `null` toutes les
 * clés de `USER_METADATA_KEYS` puis écrit celles fournies, qui écrasent les `null`.
 * Les clés d'accès (`app_metadata`) ne sont jamais touchées.
 *
 * À utiliser pour la correction de metadata de profil corrompues.
 * Retourne `{ error }` en cas d'échec (ne throw pas).
 *
 * @example
 * await cleanUserMetadata({ user_metadata: { name: "Awa", avatar_url } })
 */
export async function cleanUserMetadata({
  user_metadata,
}: {
  user_metadata: UserMetadata;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "Utilisateur non trouvé" };
  }

  const wipe = Object.fromEntries(USER_METADATA_KEYS.map((key) => [key, null]));

  const { data: updatedUser, error: updateError } =
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...wipe, ...user_metadata },
    });

  if (updateError) {
    return { error: updateError.message };
  }

  await refreshCurrentUserCache();

  return { success: true, user: updatedUser.user };
}

/**
 * Met à jour les `user_metadata` de PROFIL de l'utilisateur courant (session).
 *
 * Merge superficiel au 1er niveau : clés non fournies conservées, clés fournies
 * remplacées en entier, `null` supprime la clé, `undefined` est ignoré.
 * Le typage `UserMetadataPatch` interdit les clés d'accès (role, status,
 * organization...) : pour celles-ci, utiliser `setUserAccess` (access.ts).
 *
 * Rafraîchit le cache applicatif, mais pas le JWT (claims anciens jusqu'au
 * prochain refresh). Throw en cas d'erreur.
 *
 * @example
 * await setUserInfo({ avatar_url })
 * await setUserInfo({ invitationToken: null }) // supprime la clé
 */
export async function setUserInfo(userMetadata: UserMetadataPatch) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.updateUser({
    data: userMetadata,
  });

  if (error) {
    throw error;
  }

  await refreshCurrentUserCache();

  return data.user;
}

/* =========================
   UTILISATEUR CIBLE (ADMIN)
========================= */

/**
 * Met à jour les `user_metadata` d'un utilisateur cible (client admin) :
 * champs de profil seulement (name, avatar_url, phone, invitation...).
 * Pour les clés d'accès, utiliser `updateUserAccess` (access.ts).
 *
 * Merge au 1er niveau : clés non fournies conservées, clés fournies remplacées
 * en entier, `null` supprime la clé.
 *
 * Appelé hors transaction Prisma (best-effort) : l'échec est loggé sans throw.
 * Ne rafraîchit ni le cache ni le JWT de l'utilisateur ciblé.
 *
 * @example
 * await updateUserMetadata(invitedUserId, { invitationToken: null })
 */
export async function updateUserMetadata(
  targetUserId: string,
  metadata: UserMetadataPatch,
) {
  const supabase = await createClient();
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: metadata,
  });
  if (error) {
    console.error("[updateUserMetadata]", targetUserId, error.message);
    return { error: error.message };
  }
  
  CacheInvalidation.onUserUpdate(targetUserId);
  return { error: null };
}