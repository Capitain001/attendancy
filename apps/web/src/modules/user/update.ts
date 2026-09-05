// src/modules/user/update.ts
"use server";

import { Role } from "@/generated/prisma/client";

import type { UserMetadata, UserStatus } from "@/types/user";
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
 * Remplace intégralement les metadata Supabase de l'utilisateur courant.
 * Contrairement à `setUserInfo`, utilise le client admin  donc pas de merge,
 * les champs non fournis sont supprimés.
 *
 * À utiliser pour les réinitialisations ou corrections de metadata corrompues.
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

  const { data: updatedUser, error: updateError } =
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata,
    });

  if (updateError) {
    return { error: updateError.message };
  }

  await refreshCurrentUserCache();

  return { success: true, user: updatedUser.user };
}

/**
 * Merge partiellement les metadata Supabase de l'utilisateur courant.
 * Seuls les champs fournis sont mis à jour  les autres sont conservés.
 *
 * C'est la fonction de base pour toutes les mises à jour de session utilisateur.
 * Rafraîchit le cache après l'écriture.
 * @example
 * await setUserInfo({ status: "ACTIVE", organization: targetOrg })
 */
export async function setUserInfo(userMetadata: UserMetadata) {
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
 * Change l'organisation active de l'utilisateur dans ses metadata Supabase.
 * Recherche l'organisation dans `user.organizations` et la définit comme `organization`.
 *
 * Utilisé lors du switch d'organisation dans l'interface.
 *
 * @throws si l'utilisateur n'est pas authentifié ou si l'orgId est introuvable
 *
 * @example
 * await setCurrentOrganization("org-uuid")
 */
export async function setCurrentOrganization(orgId: string) {
  const user = await getUserInfo();
  if (!user?.id) throw new Error("Utilisateur non trouvé.");

  const targetOrg = user.organizations?.find(
    (organization) => organization.id === orgId
  );
  if (!targetOrg) throw new Error("Organisation introuvable.");

  await setUserInfo({ organization: targetOrg });

  return targetOrg;
}

/* =========================
   SYNCHRONISATION DU PROFIL DE RÔLE
========================= */

/**
 * Met à jour les metadata Supabase après la création d'une entité métier
 * (Teacher, Student, Parent, Direction) pour y injecter l'ID du profil.
 *
 * Met à jour simultanément :
 * - `organizations` : le tableau complet avec le bon profileId injecté
 * - `organization`  : l'organisation courante synchronisée
 * - `status`        : optionnel, ex: "ACTIVE" après acceptance d'invitation
 *
 * Cas d'usage : completeSignup, création admin, réassignation de rôle,
 * migration de metadata, switch d'organisation avec changement de rôle.
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
  const currentUser = await getUserInfo();

  const updatedOrgs = updateOrganizationsProfile(
    currentUser?.organizations ?? [],
    orgId,
    role,
    profileId
  );

  await setUserInfo({
    ...(status && { status }),
    organizations: updatedOrgs,
    organization: updatedOrgs.find((org) => org.id === orgId),
  });
}



/**
 * Met à jour partiellement les user_metadata Supabase d'un utilisateur cible
 * via le client admin. Merge partiel natif  les champs non fournis sont préservés.
 * Appelé hors transaction Prisma (best-effort) : échec loggé sans throw.
 */
export async function updateUserMetadata(
  targetUserId: string,
  metadata: Partial<UserMetadata>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: metadata,
  });
  if (error) {
    console.error("[updateUserMetadata]", targetUserId, error.message);
  }
}
