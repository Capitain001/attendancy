apps/web/scripts/migrate-metadata.ts

s‎
+61
Lines changed: 61 additions & 0 deletions
Original file line number	Diff line number	Diff line change
@@ -0,0 +1,61 @@
﻿// scripts/migrate-metadata.ts
// Migre les données de user_metadata → app_metadata (service role, idempotent)
//
// Usage :
//   bun scripts/migrate-metadata.ts            # copie user_metadata → app_metadata (sans écraser)
//   bun scripts/migrate-metadata.ts --purge    # efface les clés migrées de user_metadata
import { createClient } from "@supabase/supabase-js";
const USER_METADATA_KEYS = [
  "role", "name", "avatar_url", "phone", "function",
  "organization", "organizations", "invited_by", "status",
  "invitationToken", "invitationType", "isConnected",
] as const;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const purge = process.argv.includes("--purge");
console.log(`Mode : ${purge ? "PURGE user_metadata" : "COPIE vers app_metadata"}`);
let page = 1, totalProcessed = 0, totalSkipped = 0, totalErrors = 0;
for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error("Erreur listUsers:", error.message); process.exit(1); }
  if (!data.users.length) break;
  for (const user of data.users) {
    const from = (user.user_metadata ?? {}) as Record<string, unknown>;
    const keys = USER_METADATA_KEYS.filter((k) => k in from);
    if (!keys.length) { totalSkipped++; continue; }
    if (purge) {
      const nullPatch = Object.fromEntries(keys.map((k) => [k, null]));
      const { error: e } = await admin.auth.admin.updateUserById(user.id, { user_metadata: nullPatch });
      if (e) { console.error(`[PURGE] ${user.id}:`, e.message); totalErrors++; }
      else { console.log(`[PURGE] ${user.id}: ${keys.join(", ")}`); totalProcessed++; }
    } else {
      const existing = (user.app_metadata ?? {}) as Record<string, unknown>;
      const toCopy = keys.filter((k) => !(k in existing));
      if (!toCopy.length) { totalSkipped++; continue; }
      const patch = Object.fromEntries(toCopy.map((k) => [k, from[k]]));
      const { error: e } = await admin.auth.admin.updateUserById(user.id, { app_metadata: patch });
      if (e) { console.error(`[COPY] ${user.id}:`, e.message); totalErrors++; }
      else { console.log(`[COPY] ${user.id}: ${toCopy.join(", ")}`); totalProcessed++; }
    }
  }
  page++;
}
console.log(`\nRésumé :\n  Traités : ${totalProcessed}\n  Ignorés : ${totalSkipped}\n  Erreurs : ${totalErrors}`);


apps/web/src/app/api/teacher/schedule-days/route.ts‎
+1
-1
Lines changed: 1 addition & 1 deletion
Original file line number	Diff line number	Diff line change
@@ -27,7 +27,7 @@ export async function GET(req: NextRequest) {
  }

  const user = await verifyBearerToken(token)
  const meta = (user?.user_metadata ?? {}) as {
  const meta = (user?.app_metadata ?? {}) as {
    organization?: { id?: string }
    role?: string
  }

apps/web/src/app/auth/invite/page.tsx‎
+1
-1
Lines changed: 1 addition & 1 deletion
Original file line number	Diff line number	Diff line change
@@ -50,7 +50,7 @@ function InviteRelay() {
      console.log('[invite] session établie :', {
        userId: data.user?.id,
        email:  data.user?.email,
        role:   data.user?.user_metadata?.role,
        role:   data.user?.app_metadata?.role,
      })
      console.log('[invite] → redirect /auth/welcome')
      router.replace(`/auth/welcome`)

apps/web/src/modules/auth/profile/user.ts‎
+1
-1
Lines changed: 1 addition & 1 deletion
Original file line number	Diff line number	Diff line change
@@ -100,7 +100,7 @@ export async function upsertUserProfile(params: {

  // Crée le profil de rôle + injecte le profileId dans les metadata (sinon le
  // callback renvoie indéfiniment vers /auth/user-info).
  await ensureRoleProfile((user.user_metadata ?? {}) as UserMetadata, userId)
  await ensureRoleProfile((user.app_metadata ?? {}) as UserMetadata, userId)

  return profile
}

‎apps/web/src/modules/invitation/invitation.ts‎
+13
-3
Lines changed: 13 additions & 3 deletions
Original file line number	Diff line number	Diff line change
@@ -28,16 +28,26 @@ export async function sendSupabaseInvitation(
  const adminClient = await createClient();
  const inviteData = createSupabaseInviteData(metadata);

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
  const { data: inviteResult, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_URL,
    data: inviteData,
  });

  if (error) {
    // ✅ UTILISATION DU GESTIONNAIRE D'ERREURS
    // return supabaseInvitationError(error);
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


  ‎apps/web/src/modules/permission/sync.ts‎
+2
-2
Lines changed: 2 additions & 2 deletions
Original file line number	Diff line number	Diff line change
@@ -61,7 +61,7 @@ export async function syncUserPermissionsMetadata(userId: string, orgId: string)
    return
  }

  const metadata = (user.user_metadata ?? {}) as UserMetadata
  const metadata = (user.app_metadata ?? {}) as UserMetadata
  const organizations = metadata.organizations ?? []

  const targetIndex = organizations.findIndex((org) => org.id === orgId)
@@ -85,7 +85,7 @@ export async function syncUserPermissionsMetadata(userId: string, orgId: string)
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...metadata, ...patch },
    app_metadata: patch,
  })

  if (updateError) {

‎apps/web/src/types/user.ts‎
-2
Lines changed: 0 additions & 2 deletions
Original file line number	Diff line number	Diff line change
@@ -96,8 +96,6 @@ export const USER_METADATA_KEYS = [
  "name",
  "avatar_url",
  "phone",
  "email_verified",
  "phone_verified",
  "function",
  "organization",
  "organizations",


‎apps/web/src/modules/user/utils.ts‎
+4
-2
Lines changed: 4 additions & 2 deletions
Original file line number	Diff line number	Diff line change
@@ -15,6 +15,8 @@ export function mapUserInfo({
  return {
    id: user.id,
    email: user.email ?? undefined,
    email_verified: Boolean(user.email_confirmed_at),
    phone_verified: Boolean(user.phone_confirmed_at),
    role: userMetadata.role || UserRoles.GUEST,
    name: userMetadata.name || user.email?.split("@")[0] || "",
    avatar_url: userMetadata.avatar_url,
@@ -25,7 +27,7 @@ export function mapUserInfo({
    status: userMetadata.status || UserStatus.PENDING,
    invitationToken: userMetadata.invitationToken ?? undefined,
    invitationType: userMetadata.invitationType ?? undefined,
    isConnected: userMetadata.isConnected || true,
    isConnected: userMetadata.isConnected ?? true,
    updated_at: user.updated_at,
  }
}
@@ -69,7 +71,7 @@ export async function superAdminStatus(user:UserInfo) {
  export function checkSuperAdminStatus(user: any) {
    return (
      user?.email === process.env.SUPER_ADMIN_EMAIL ||
      user?.user_metadata?.function === "SUPER_ADMIN" ||
      user?.app_metadata?.function === "SUPER_ADMIN" ||
      user?.function === "SUPER_ADMIN"
    );
  }

‎apps/web/src/modules/user/userInfo.ts‎
+1
-1
Lines changed: 1 addition & 1 deletion
Original file line number	Diff line number	Diff line change
@@ -93,7 +93,7 @@ const fetchUserFromSupabase = cache(async (userId: string) => {
    return null
  }

  const userMetadata: UserMetadata = user.user_metadata || {}
  const userMetadata: UserMetadata = user.app_metadata as UserMetadata || {}
  return mapUserInfo({ user, userMetadata })
})

‎apps/web/src/modules/user/update.ts‎
+15
-12
Lines changed: 15 additions & 12 deletions
Original file line number	Diff line number	Diff line change
@@ -27,12 +27,12 @@ async function refreshCurrentUserCache() {
========================= */

/**
 * Réinitialise les user_metadata de l'utilisateur courant (client admin).
 * Réinitialise les app_metadata de l'utilisateur courant (client admin).
 *
 * Le merge Supabase étant superficiel (clés absentes conservées), un simple
 * appel à `updateUserById` ne supprime rien. Cette fonction met donc à `null`
 * toutes les clés de `USER_METADATA_KEYS` (types/user.ts) puis écrit les clés fournies, qui
 * écrasent les `null`. Résultat : `user_metadata` ne contient plus que les
 * écrasent les `null`. Résultat : `app_metadata` ne contient plus que les
 * clés fournies (les clés hors `UserMetadata` ne sont pas touchées).
 *
 * À utiliser pour les réinitialisations ou la correction de metadata corrompues.
@@ -65,7 +65,7 @@ export async function cleanUserMetadata({

  const { data: updatedUser, error: updateError } =
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...wipe, ...user_metadata },
      app_metadata: { ...wipe, ...user_metadata },
    });

  if (updateError) {
@@ -78,27 +78,30 @@ export async function cleanUserMetadata({
}

/**
 * Met à jour les user_metadata de l'utilisateur courant (session).
 * Met à jour les app_metadata de l'utilisateur courant (client admin).
 *
 * Merge superficiel au 1er niveau : les clés non fournies sont conservées,
 * les clés fournies sont remplacées en entier (tableaux et objets imbriqués
 * compris, ex. `organizations`, `organization`). `null` supprime la clé,
 * `undefined` est ignoré.
 *
 * Base de toutes les mises à jour de session utilisateur. Rafraîchit le cache
 * applicatif, mais pas le JWT : ses claims restent anciens jusqu'au prochain
 * refresh de session (`getUser()` est fiable, `getSession()` non).
 * Sécurisé : le client final ne peut pas modifier `app_metadata` via
 * `supabase.auth.updateUser({ data: … })` (qui n'écrit que dans `user_metadata`).
 * Rafraîchit le cache applicatif, mais pas le JWT : ses claims restent anciens
 * jusqu'au prochain refresh de session.
 * Throw en cas d'erreur.
 *
 * @example
 * await setUserInfo({ status: "ACTIVE", organization: targetOrg })
 * await setUserInfo({ invitationToken: null }) // supprime la clé
 */
export async function setUserInfo(userMetadata: UserMetadataPatch) {
  const supabase = await createClient();
  const current = await getUserInfo();
  if (!current?.id) throw new Error("Utilisateur non trouvé");

  const { data, error } = await supabase.auth.updateUser({
    data: userMetadata,
  const supabase = await createClient();
  const { data, error } = await supabase.auth.admin.updateUserById(current.id, {
    app_metadata: userMetadata,
  });

  if (error) {
@@ -197,7 +200,7 @@ export async function syncUserOrganizationProfile({
========================= */

/**
 * Met à jour les user_metadata d'un utilisateur cible (client admin).
 * Met à jour les app_metadata d'un utilisateur cible (client admin).
 *
 * Merge superficiel au 1er niveau : clés non fournies conservées, clés
 * fournies remplacées en entier, `null` supprime la clé.
@@ -215,7 +218,7 @@ export async function updateUserMetadata(
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: metadata,
    app_metadata: metadata,
  });
  if (error) {
    console.error("[updateUserMetadata]", targetUserId, error.message);

‎apps/web/src/modules/permission/sync.ts‎
+2
-2
Lines changed: 2 additions & 2 deletions
Original file line number	Diff line number	Diff line change
@@ -61,7 +61,7 @@ export async function syncUserPermissionsMetadata(userId: string, orgId: string)
    return
  }

  const metadata = (user.user_metadata ?? {}) as UserMetadata
  const metadata = (user.app_metadata ?? {}) as UserMetadata
  const organizations = metadata.organizations ?? []

  const targetIndex = organizations.findIndex((org) => org.id === orgId)
@@ -85,7 +85,7 @@ export async function syncUserPermissionsMetadata(userId: string, orgId: string)
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...metadata, ...patch },
    app_metadata: patch,
  })

  if (updateError) {


‎apps/web/src/modules/invitation/supabase.ts‎
+3
-7
Lines changed: 3 additions & 7 deletions
Original file line number	Diff line number	Diff line change
@@ -67,12 +67,10 @@ export async function resendInvitation(
    if (!user.email_confirmed_at) {
      // Utilisateur EXISTANT non confirmé : inviteUserByEmail ignore silencieusement `data`
      // pour un utilisateur déjà créé (data n'est honoré qu'à la création). Il faut donc
      // écrire nous-mêmes le nouveau user_metadata via updateUserById, en mergeant avec
      // l'existant puisque updateUserById REMPLACE tout le user_metadata (pas de merge Supabase).
      // écrire nous-mêmes le nouveau app_metadata via updateUserById.
      if (metadata) {
        const mergedMetadata = { ...(user.user_metadata ?? {}), ...metadata };
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: mergedMetadata,
          app_metadata: metadata,
        });
        if (updateError) {
          return { success: false, error: updateError.message };
@@ -81,7 +79,6 @@ export async function resendInvitation(

      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: INVITE_URL,
        data: metadata || {},
      });

      if (error) {
@@ -137,9 +134,8 @@ export async function generateMagicLink(
      const user = 'error' in findResult ? null : findResult.data.user;

      if (user) {
        const mergedMetadata = { ...(user.user_metadata ?? {}), ...metadata };
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: mergedMetadata,
          app_metadata: metadata,
        });
        if (updateError) {
          return { success: false, error: updateError.message };

‎apps/web/src/modules/invitation/invitation.ts‎
+13
-3
Lines changed: 13 additions & 3 deletions
Original file line number	Diff line number	Diff line change
@@ -28,16 +28,26 @@ export async function sendSupabaseInvitation(
  const adminClient = await createClient();
  const inviteData = createSupabaseInviteData(metadata);

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
  const { data: inviteResult, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_URL,
    data: inviteData,
  });

  if (error) {
    // ✅ UTILISATION DU GESTIONNAIRE D'ERREURS
    // return supabaseInvitationError(error);
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

‎apps/web/src/app/auth/invite/page.tsx‎
+1
-1
Lines changed: 1 addition & 1 deletion
Original file line number	Diff line number	Diff line change
@@ -50,7 +50,7 @@ function InviteRelay() {
      console.log('[invite] session établie :', {
        userId: data.user?.id,
        email:  data.user?.email,
        role:   data.user?.user_metadata?.role,
        role:   data.user?.app_metadata?.role,
      })
      console.log('[invite] → redirect /auth/welcome')
      router.replace(`/auth/welcome`)
‎apps/web/src/modules/auth/profile/user.ts‎
+1
-1
Lines changed: 1 addition & 1 deletion
Original file line number	Diff line number	Diff line change
@@ -100,7 +100,7 @@ export async function upsertUserProfile(params: {

  // Crée le profil de rôle + injecte le profileId dans les metadata (sinon le
  // callback renvoie indéfiniment vers /auth/user-info).
  await ensureRoleProfile((user.user_metadata ?? {}) as UserMetadata, userId)
  await ensureRoleProfile((user.app_metadata ?? {}) as UserMetadata, userId)

  return profile
}

‎apps/web/src/app/api/teacher/schedule-days/route.ts‎
+1
-1
Lines changed: 1 addition & 1 deletion
Original file line number	Diff line number	Diff line change
@@ -27,7 +27,7 @@ export async function GET(req: NextRequest) {
  }

  const user = await verifyBearerToken(token)
  const meta = (user?.user_metadata ?? {}) as {
  const meta = (user?.app_metadata ?? {}) as {
    organization?: { id?: string }
    role?: string
  }