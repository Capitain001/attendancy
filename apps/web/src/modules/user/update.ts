// src/modules/user/update.ts
"use server";

import { Role } from "@/generated/prisma/browser";

import {
  USER_METADATA_KEYS,
  type UserMetadata,
  type UserMetadataPatch,
  type UserStatus,
} from "@/types/user";
import { createClient } from "@/utils/supabase/server";

import { getUserInfo } from "./userInfo";
import { updateOrganizationsProfile } from "./profile";

/* =========================
   CACHE
========================= */

async function refreshCurrentUserCache() {
  await getUserInfo({ refresh: true });
}

/* =========================
   METADATA SUPABASE
========================= */

/**
 * Réinitialise les user_metadata de l'utilisateur courant (client admin).
 *
 * Le merge Supabase étant superficiel (clés absentes conservées), un simple
 * appel à `updateUserById` ne supprime rien. Cette fonction met donc à `null`
 * toutes les clés de `USER_METADATA_KEYS` (types/user.ts) puis écrit les clés fournies, qui
 * écrasent les `null`. Résultat : `user_metadata` ne contient plus que les
 * clés fournies (les clés hors `UserMetadata` ne sont pas touchées).
 *
 * À utiliser pour les réinitialisations ou la correction de metadata corrompues.
 * Retourne `{ error }` en cas d'échec (ne throw pas) et rafraîchit le cache
 * applicatif en cas de succès. Le JWT garde ses anciens claims jusqu'au
 * prochain refresh de session.
 *
 * @example
 * await cleanUserMetadata({ user_metadata: { role: "TEACHER", status: "ACTIVE" } })
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

  const wipe = Object.fromEntries(
    USER_METADATA_KEYS.map((key) => [key, null]),
  );

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
 * Met à jour les user_metadata de l'utilisateur courant (session).
 *
 * Merge superficiel au 1er niveau : les clés non fournies sont conservées,
 * les clés fournies sont remplacées en entier (tableaux et objets imbriqués
 * compris, ex. `organizations`, `organization`). `null` supprime la clé,
 * `undefined` est ignoré.
 *
 * Base de toutes les mises à jour de session utilisateur. Rafraîchit le cache
 * applicatif, mais pas le JWT : ses claims restent anciens jusqu'au prochain
 * refresh de session (`getUser()` est fiable, `getSession()` non).
 * Throw en cas d'erreur.
 *
 * @example
 * await setUserInfo({ status: "ACTIVE", organization: targetOrg })
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
   ORGANISATION COURANTE
========================= */

/**
 * Définit l'organisation active (`organization`) de l'utilisateur à partir de
 * son tableau `organizations`. Utilisé lors du switch d'organisation dans
 * l'interface. Remplace l'objet `organization` en entier.
 *
 * @throws si l'utilisateur n'est pas authentifié ou si `orgId` est introuvable
 *
 * @example
 * await setCurrentOrganization("org-uuid")
 */
export async function setCurrentOrganization(orgId: string) {
  const user = await getUserInfo();
  if (!user?.id) throw new Error("Utilisateur non trouvé.");

  const targetOrg = user.organizations?.find(
    (organization) => organization.id === orgId,
  );
  if (!targetOrg) throw new Error("Organisation introuvable.");

  await setUserInfo({ organization: targetOrg });

  return targetOrg;
}

/* =========================
   SYNCHRONISATION DU PROFIL DE RÔLE
========================= */

/**
 * Injecte l'ID du profil métier (Teacher, Student, Parent, Direction) dans les
 * metadata après sa création. Écrit en un seul appel :
 * - `organizations` : tableau complet avec le bon profileId
 * - `organization`  : organisation courante resynchronisée
 * - `status`        : optionnel (ex. "ACTIVE" après acceptation d'invitation)
 *
 * Opération read-modify-write sur `organizations` : la lecture force un
 * rafraîchissement du cache, mais deux appels concurrents peuvent quand même
 * s'écraser (le dernier gagne). Si `orgId` est absent du tableau résultant,
 * `organization` n'est pas mis à jour.
 *
 * Cas d'usage : completeSignup, création admin, réassignation de rôle,
 * migration de metadata, switch d'organisation avec changement de rôle.
 *
 * @example
 * await syncUserOrganizationProfile({
 *   orgId: "org-uuid",
 *   role: "TEACHER",
 *   profileId: teacher.id,
 *   status: "ACTIVE",
 * })
 */
export async function syncUserOrganizationProfile({
  orgId,
  role,
  profileId,
  status,
}: {
  orgId: string;
  role: Role;
  profileId?: string;
  status?: UserStatus;
}) {
  const currentUser = await getUserInfo({ refresh: true });

  const updatedOrgs = updateOrganizationsProfile(
    currentUser?.organizations ?? [],
    orgId,
    role,
    profileId,
  );

  await setUserInfo({
    ...(status && { status }),
    organizations: updatedOrgs,
    organization: updatedOrgs.find((org) => org.id === orgId),
  });
}

/* =========================
   UTILISATEUR CIBLE (ADMIN)
========================= */

/**
 * Met à jour les user_metadata d'un utilisateur cible (client admin).
 *
 * Merge superficiel au 1er niveau : clés non fournies conservées, clés
 * fournies remplacées en entier, `null` supprime la clé.
 *
 * Appelé hors transaction Prisma (best-effort) : l'échec est loggé sans throw.
 * Ne rafraîchit ni le cache ni le JWT de l'utilisateur ciblé : il verra les
 * changements à sa prochaine session ou à son prochain refresh.
 *
 * @example
 * await updateUserMetadata(invitedUserId, { status: "ACTIVE" })
 */
export async function updateUserMetadata(
  targetUserId: string,
  metadata: UserMetadataPatch,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: metadata,
  });
  if (error) {
    console.error("[updateUserMetadata]", targetUserId, error.message);
  }
}