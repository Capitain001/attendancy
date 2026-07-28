// src/services/user/update.ts
// Utilitaires de mise à jour des métadonnées Supabase de l'utilisateur courant.
// Ces fonctions s'exécutent côté serveur (Server Actions / Route Handlers).
// Toute écriture dans user_metadata DOIT passer ici pour garantir l'invalidation
// du cache LRU après la mutation.
import { createClient, createAdminClient } from '@/utils/supabase/server'
import type { UserMetadata, Role, UserStatus } from './types'
import { getUserInfo } from './userInfo'
import { removeUser } from './lru-cache'
import { updateOrganizationsProfile } from './profile'

// ── Primitives ────────────────────────────────────────────────────────────────

// Merge partiel — seuls les champs fournis sont mis à jour, les autres préservés.
// C'est la fonction de base pour toutes les mutations de session.
export async function setUserInfo(userMetadata: UserMetadata) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.updateUser({ data: userMetadata })
  if (error) throw error
  // Invalider le LRU — le prochain appel relit depuis Supabase
  if (data.user.id) removeUser(data.user.id)
  return data.user
}

// Remplacement intégral des metadata via admin API (les champs absents sont supprimés).
// À réserver aux corrections/réinitialisations — préférer setUserInfo pour les MAJ courantes.
export async function cleanUserMetadata(userId: string, user_metadata: UserMetadata) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.auth.admin.updateUserById(userId, { user_metadata })
  if (error) return { error: error.message }
  removeUser(userId)
  return { data: { user: data.user } }
}

// Mise à jour best-effort des metadata d'un utilisateur tiers (hors transaction).
// Échec loggé sans throw — ne pas bloquer une mutation principale pour ça.
export async function updateUserMetadata(
  targetUserId: string,
  metadata: Partial<UserMetadata>
): Promise<void> {
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: metadata,
  })
  if (error) console.error('[updateUserMetadata]', targetUserId, error.message)
  else removeUser(targetUserId)
}

// ── Organisation courante ─────────────────────────────────────────────────────

// Change l'organisation active dans les metadata Supabase.
// Recherche dans `user.organizations` — throw si introuvable.
export async function setCurrentOrganization(orgId: string) {
  const user = await getUserInfo()
  if (!user?.id) throw new Error('Utilisateur non trouvé')

  const targetOrg = user.organizations?.find((o) => o.id === orgId)
  if (!targetOrg) throw new Error('Organisation introuvable')

  await setUserInfo({ organization: targetOrg })
  return targetOrg
}

// ── Synchronisation du profil de rôle ────────────────────────────────────────

// Injecte l'ID du profil métier (teacherId, studentId…) dans les metadata Supabase
// après la création d'une entité de rôle.
// Appelé depuis completeSignup et toute action qui crée un profil métier.
export async function syncUserOrganizationProfile({
  orgId,
  role,
  profileId,
  status,
}: {
  orgId: string
  role: Role
  profileId?: string
  status?: string
}) {
  const user = await getUserInfo()

  const updatedOrgs = updateOrganizationsProfile(
    user?.organizations ?? [],
    orgId,
    role,
    profileId
  )

  await setUserInfo({
    ...(status ? { status: status as UserStatus } : {}),
    organizations: updatedOrgs,
    organization: updatedOrgs.find((o) => o.id === orgId),
  })
}
