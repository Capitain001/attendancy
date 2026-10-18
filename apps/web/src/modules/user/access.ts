// src/modules/user/access.ts
// Écritures d'accès (app_metadata). Module serveur uniquement : aucune fonction ici
// ne doit être appelable depuis le navigateur, sinon un client pourrait s'attribuer
// n'importe quel rôle ou organisation.
// Pour les champs de profil (name, avatar_url...), voir update.ts.

import "server-only";

import type { Role } from "@/generated/prisma/browser";
import type { AppMetadataPatch, UserStatus } from "@/types/user";
import { createClient } from "@/utils/supabase/server";

import { getUserInfo } from "./userInfo";
import { updateOrganizationsProfile } from "./profile";
import { CacheInvalidation } from "./cache/operations";

/* =========================
   ÉCRITURE DES CLÉS D'ACCÈS
========================= */

/**
 * Écrit des clés d'accès dans `app_metadata` d'un utilisateur cible (client admin).
 * Seules les clés de `APP_METADATA_KEYS` sont typables ; `null` supprime une clé.
 *
 * Fusion au 1er niveau : les clés non fournies sont conservées.
 * TODO : à confirmer par le test fusion/remplacement (étape 0), sinon lire puis fusionner.
 *
 * Ne rafraîchit ni le cache ni le JWT de la cible (utiliser `setUserAccess` pour soi-même).
 * Throw en cas d'erreur : une écriture d'accès échouée ne doit jamais passer inaperçue.
 *
 * @example
 * await updateUserAccess(inviteeId, { role: "TEACHER", status: "ACTIVE", organizations })
 */
export async function updateUserAccess(
  targetUserId: string,
  patch: AppMetadataPatch,
){
  const supabase = await createClient();
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    app_metadata: patch,
  });
  if (error) throw error;

  CacheInvalidation.onUserUpdate(targetUserId);
}

/**
 * Écrit des clés d'accès pour l'utilisateur courant (identité issue de la session,
 * jamais d'un paramètre) puis rafraîchit le cache applicatif.
 *
 * Utilisé après une décision serveur : switch de profil, changement d'organisation,
 * création d'organisation, acceptation d'invitation.
 * Le JWT garde ses anciens claims jusqu'au prochain refresh de session.
 *
 * @throws si l'utilisateur n'est pas authentifié ou si l'écriture échoue
 *
 * @example
 * await setUserAccess({ role, organization, organizations })
 */
export async function setUserAccess(patch: AppMetadataPatch) {
  const current = await getUserInfo();
  if (!current?.id) throw new Error("Utilisateur non trouvé");

  await updateUserAccess(current.id, patch);
  await getUserInfo({ refresh: true });
}

/* =========================
   ORGANISATION COURANTE
========================= */

/**
 * Définit l'organisation active (`organization`) à partir de `user.organizations`
 * (lues dans `app_metadata`, donc fiables). Utilisé lors du switch d'organisation.
 * Remplace l'objet `organization` en entier.
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

  await setUserAccess({ organization: targetOrg });

  return targetOrg;
}

/* =========================
   SYNCHRONISATION DU PROFIL DE RÔLE
========================= */

/**
 * Injecte l'ID du profil métier (Teacher, Student, Parent, Direction) dans les
 * metadata d'accès après sa création. Écrit en un seul appel :
 * - `organizations` : tableau complet avec le bon profileId
 * - `organization`  : organisation courante resynchronisée
 * - `status`        : optionnel (ex. "ACTIVE" après acceptation d'invitation)
 *
 * Réservée au serveur : `status` et `profileId` ne doivent jamais venir du client.
 * Opération read-modify-write sur `organizations` : la lecture force un
 * rafraîchissement du cache, mais deux appels concurrents peuvent s'écraser
 * (le dernier gagne). Si `orgId` est absent du tableau, `organization` n'est pas mis à jour.
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

  await setUserAccess({
    ...(status && { status }),
    organizations: updatedOrgs,
    organization: updatedOrgs.find((org) => org.id === orgId),
  });
}