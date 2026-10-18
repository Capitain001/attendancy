# Feature : séparer `user_metadata` (simple) et `app_metadata` (accès)

## Contexte

`user_metadata` est modifiable par l'utilisateur lui-même (`supabase.auth.updateUser` avec la clé publique, ou un appel direct à l'API Auth). Tout ce qui sert à autoriser (rôle, organisation, permissions) doit donc vivre dans `app_metadata`, que seul le service role peut écrire. `UserInfo` reste l'unique objet exposé : les appelants ne savent pas d'où vient une valeur.

## Règles non négociables

1. **Une clé, un seul domicile.** Aucune synchronisation ni copie entre les deux objets.
2. **Lecture.** Les clés d'accès sont lues uniquement dans `app_metadata`, sans repli sur `user_metadata`. Une clé absente donne la valeur la plus restrictive : `GUEST`, `PENDING`, `[]`.
3. **Écriture.** Les clés d'accès ne s'écrivent que via `setUserAccess` ou `updateUserAccess`. Le typage doit empêcher d'en écrire une via `setUserInfo`.
4. **Pas de `"use server"` sur les écritures d'accès.** Elles vont dans un module `import "server-only"`. Dans un fichier `"use server"`, tout export est un endpoint appelable à distance avec des arguments choisis par le client.
5. **Pas d'appel supplémentaire par flow.** Les clés d'accès sont posées là où le serveur décide (création d'organisation, acceptation d'invitation, switch de profil), pas à l'inscription.

## Étape 0 : test bloquant (fusion ou remplacement)

Un ancien commentaire du code affirme que `admin.updateUserById` remplace tout l'objet de metadata, alors que d'autres éléments suggèrent une fusion au premier niveau. Exécute sur un compte jetable :

```typescript
await admin.auth.admin.updateUserById(id, { app_metadata: { a: 1 }, user_metadata: { x: 1 } })
await admin.auth.admin.updateUserById(id, { app_metadata: { b: 2 }, user_metadata: { y: 2 } })
const { data } = await admin.auth.admin.getUserById(id)
console.log(data.user.app_metadata, data.user.user_metadata)
```

- **Fusion** : `{ a:1, b:2 }` et `{ x:1, y:2 }` → utiliser le code de l'étape 3 tel quel.
- **Remplacement** : `{ b:2 }` et `{ y:2 }` → utiliser la variante de l'étape 3, qui lit puis fusionne. Vérifie aussi si `null` supprime la clé.

## Étape 1 : types (`src/types/user.ts`)

Remplace `USER_METADATA_KEYS`, `UserMetadata`, `UserMetadataKey` et `UserMetadataPatch` par :

```typescript
/**
 * Clés stockées dans `user_metadata` : données de profil.
 * Modifiables par le client (API Auth + clé publique) → ne JAMAIS s'en servir
 * pour autoriser une action.
 * Écriture : `setUserInfo` (utilisateur courant) ou `updateUserMetadata` (utilisateur cible).
 */
export const USER_METADATA_KEYS = [
  "name", "avatar_url", "phone", "isConnected",
  "invited_by", "invitationToken", "invitationType",
] as const satisfies readonly (keyof UserInfo)[];

/**
 * Clés stockées dans `app_metadata` : tout ce qui sert à autoriser.
 * Écriture réservée au serveur (service role) via `setUserAccess` / `updateUserAccess`.
 * Lecture : sans repli sur `user_metadata`, une clé absente donne la valeur la plus restrictive.
 */
export const APP_METADATA_KEYS = [
  "role", "function", "status", "organization", "organizations",
] as const satisfies readonly (keyof UserInfo)[];

export type UserMetadataKey = (typeof USER_METADATA_KEYS)[number];
export type AppMetadataKey = (typeof APP_METADATA_KEYS)[number];

export type UserMetadata = Pick<UserInfo, UserMetadataKey>;
export type AppMetadata = Pick<UserInfo, AppMetadataKey>;

// Patch partiel : `null` supprime la clé côté Supabase, `undefined` est ignoré
type Patch<T> = { [K in keyof T]?: T[K] | null };
export type UserMetadataPatch = Patch<UserMetadata>;
export type AppMetadataPatch = Patch<AppMetadata>;
```

`email_verified` et `phone_verified` sortent des metadata : ils sont dérivés de `user.email_confirmed_at` et `user.phone_confirmed_at`. `UserInfo` ne change pas. Scinde aussi le commentaire JSON de structure en deux blocs (`app_metadata` / `user_metadata`).

## Étape 2 : lecture

Dans `modules/user/utils.ts`, `mapUserInfo` lit directement `user`, sans paramètre `userMetadata` :

```typescript
/**
 * Construit `UserInfo` à partir d'un utilisateur Supabase en fusionnant ses trois sources :
 * - `app_metadata`  : role, function, status, organization(s) (lu SANS repli sur user_metadata)
 * - `user_metadata` : name, avatar_url, phone, invitation... (profil, non fiable pour autoriser)
 * - champs natifs   : id, email, email_verified / phone_verified (dérivés de *_confirmed_at)
 *
 * Valeurs par défaut les plus restrictives : GUEST, PENDING, organizations = [].
 * L'appelant n'a pas à savoir de quel magasin provient une valeur.
 */
export function mapUserInfo({ user }: { user: SupabaseUser }): UserInfo {
  const access = (user.app_metadata ?? {}) as AppMetadata
  const profile = (user.user_metadata ?? {}) as UserMetadata

  return {
    id: user.id,
    email: user.email ?? undefined,
    email_verified: Boolean(user.email_confirmed_at),
    phone_verified: Boolean(user.phone_confirmed_at),
    role: access.role || UserRoles.GUEST,
    function: access.function || Functions.MEMBER,
    status: access.status || UserStatus.PENDING,
    organization: access.organization ?? undefined,
    organizations: access.organizations || [],
    name: profile.name || user.email?.split("@")[0] || "",
    avatar_url: profile.avatar_url,
    phone: profile.phone,
    invited_by: profile.invited_by ?? undefined,
    invitationToken: profile.invitationToken ?? undefined,
    invitationType: profile.invitationType ?? undefined,
    isConnected: profile.isConnected ?? true,
    updated_at: user.updated_at,
  }
}
```

À adapter : les appelants de `mapUserInfo` (probablement `getUserInfo` seulement) et le chemin Bearer de `getUserInfo`, qui lit peut-être les claims. Les clés d'accès y viennent de `claims.app_metadata`.

## Étape 3 : écriture

**Nouveau fichier `src/modules/user/access.ts`, sans `"use server"` :**

```typescript
// Écritures d'accès (app_metadata). Module serveur uniquement : aucune fonction ici
// ne doit être appelable depuis le navigateur, sinon un client pourrait s'attribuer
// n'importe quel rôle ou organisation.
import "server-only";

import type { Role } from "@/generated/prisma/browser";
import type { AppMetadataPatch, UserStatus } from "@/types/user";
import { createClient } from "@/utils/supabase/server";

import { getUserInfo } from "./userInfo";
import { updateOrganizationsProfile } from "./profile";

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
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    app_metadata: patch,
  });
  if (error) throw error;
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
```

**Variante si l'étape 0 montre un remplacement**, pour `updateUserAccess` :

```typescript
const { data } = await supabase.auth.admin.getUserById(targetUserId);
const merged = Object.fromEntries(
  Object.entries({ ...data.user?.app_metadata, ...patch }).filter(([, v]) => v !== null),
);
// puis: app_metadata: merged
```

**Dans `src/modules/user/update.ts` (reste `"use server"`) :**

- `setUserInfo(userMetadata: UserMetadataPatch)` : corps inchangé (`auth.updateUser({ data })`). Seul le type change, ce qui interdit les clés d'accès.
- `cleanUserMetadata` : logique inchangée. Elle réinitialise maintenant seulement `USER_METADATA_KEYS`, donc jamais l'accès.
- **Retire `updateUserMetadata(targetUserId, …)` de ce fichier.** Exportée depuis un `"use server"`, elle est aujourd'hui appelable à distance avec n'importe quel `targetUserId`. Déplace-la dans un module `server-only` (par exemple `src/modules/user/access.ts`), avec le type `UserMetadataPatch`, et mets les imports à jour.

```typescript
// src/modules/user/update.ts
"use server";

import type { UserMetadata, UserMetadataPatch, USER_METADATA_KEYS } from "@/types/user";
import { createClient } from "@/utils/supabase/server";

import { getUserInfo } from "./userInfo";
import { setUserAccess } from "./access";

/* =========================
   CACHE
========================= */

async function refreshCurrentUserCache() {
  await getUserInfo({ refresh: true });
}

/* =========================
   METADATA DE PROFIL (user_metadata)
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
 * organization...) : pour celles-ci, utiliser `setUserAccess`.
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
```
## Étape 4 : migration des appelants

| Appelant | Changement |
|---|---|
| `switchProfile`, `setCurrentOrganization`, `syncUserOrganizationProfile` | `setUserInfo(...)` devient `setUserAccess(...)`, mêmes arguments |
| `updateAvatar`, `updateProfile` | aucun, `setUserInfo` |
| `syncPermissionsMetadataFor` | `updateUserAccess(id, { organizations })` |
| Tout autre `setUserInfo({ role \| function \| status \| organization \| organizations })` | erreur de compilation à corriger vers `setUserAccess` |

## Étape 5 : inscriptions, invitations, création d'organisation

- **`signUp`, `signUpPersonal`, `signUpPrincipal`** : `options.data` ne contient plus que des champs simples (`name`, `phone`, `avatar_url`). Retire `role`, `function` et `status`. Un seul appel, comme avant.
- **Création d'organisation** (action serveur authentifiée de la direction) : ajoute `setUserAccess({ role: DIRECTION, function: PRINCIPAL, organization, organizations })`.
- **`signUpResponsable`** : retire-le du flux public. L'admin global est créé par un script ou une action réservée, avec `admin.createUser({ email, password, email_confirm: true, app_metadata: { role: ADMIN, function: SUPER_ADMIN, status } , user_metadata: { name } })`.
- **`resendInvitation`, `generateMagicLink`, `createInvitationLink`** : reviens à la version « avant » (`data` avec `invitationToken`, `invited_by`, `invitationType` uniquement, plus la fusion `user_metadata` pour un utilisateur existant). Aucun `app_metadata` à la création du lien.
- **Acceptation d'invitation** (action serveur) : lit la ligne `Invitation` par `token`, **vérifie que `Invitation.email` correspond à l'email de l'utilisateur connecté** et que le jeton n'est pas consommé, puis `setUserAccess({ role, function, status: ACTIVE, organization, organizations })` à partir de la ligne en base, jamais des metadata.

## Étape 6 : données existantes (seulement s'il y a de vrais comptes)

Ordre : copier avant de déployer la lecture, puis déployer, puis recopier, puis purger. Le script copie vers `app_metadata` les clés de `APP_METADATA_KEYS` présentes dans `user_metadata`, sans écraser celles qui existent déjà dans `app_metadata`. Après vérification, une passe met ces clés à `null` dans `user_metadata`. Les valeurs recopiées viennent d'un magasin falsifiable : si un doute existe, recalcule `role` et `organizations` depuis Prisma. Sans compte réel, saute cette étape.

## Étape 7 : garde-fous et tests d'acceptation

1. `supabase.auth.updateUser({ data: { role: "DIRECTION", status: "ACTIVE" } })` depuis un client, puis `getUserInfo()` : le rôle et le statut ne changent pas.
2. Un `signUp({ options: { data: { role: "ADMIN" } } })` direct donne un utilisateur `GUEST`.
3. `setUserAccess({ organization })` n'efface ni `role` ni `organizations`. `setUserInfo({ avatar_url })` ne touche à aucune clé d'accès.
4. À la compilation : `setUserInfo({ role })` et `setUserAccess({ name })` échouent.
5. Flux de bout en bout : inscription personnelle, inscription principal, création d'organisation, création et renvoi d'invitation, acceptation, switch de profil, changement d'organisation courante, mise à jour d'avatar.
6. `grep user_metadata` ne remonte que `mapUserInfo`, `setUserInfo`, `cleanUserMetadata`, le module admin des metadata simples et les fusions d'invitation. Optionnel : une règle ESLint `no-restricted-syntax` sur `MemberExpression[property.name='user_metadata']` pour empêcher les nouveaux usages.

## À vérifier dans le code

- le chemin Bearer de `getUserInfo` (Tauri) et tout middleware qui lit `user_metadata` ou des claims ;
- les templates d'email qui utilisent `{{ .Data.xxx }}` (ils lisent `user_metadata`) ;
- où `status` passe de `NEW` ou `INVITED` à `ACTIVE`, pour que ce soit un `setUserAccess` ;
- tout composant client ou code Tauri qui lit `user_metadata` pour un champ d'accès.

Changements

Dans modules/user/access.ts, ajoute l’import de type, l’en-tête, puis la fonction (code identique, avec le retour { error }) :

typescript
// Écritures admin de metadata (app_metadata = accès, user_metadata = profil).
// Module serveur uniquement : aucune fonction ici ne doit être appelable depuis
// le navigateur, sinon un client pourrait modifier n'importe quel utilisateur.
import "server-only";

import type { AppMetadataPatch, UserMetadataPatch, UserStatus } from "@/types/user";
// ... autres imports inchangés

/**
 * Met à jour les `user_metadata` d'un utilisateur cible (client admin) :
 * champs de profil seulement (name, avatar_url, phone, invitation...).
 * Pour les clés d'accès, utiliser `updateUserAccess`.
 *
 * Merge au 1er niveau : clés non fournies conservées, clés fournies remplacées
 * en entier, `null` supprime la clé.
 *
 * Best-effort : l'échec est loggé et retourné dans `{ error }`, sans throw.
 * Ne rafraîchit ni le cache ni le JWT de l'utilisateur ciblé.
 *
 * @example
 * await updateUserMetadata(invitedUserId, { invitationToken: null })
 */
export async function updateUserMetadata(
  targetUserId: string,
  metadata: UserMetadataPatch,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: metadata,
  });
  if (error) {
    console.error("[updateUserMetadata]", targetUserId, error.message);
    return { error: error.message };
  }
  return { error: null };
}

Dans modules/invitation/supabase.ts, une seule ligne change :

typescript

## fichier impacter par les modifs

NB: ne pas lire ou modifier les fichier impacter suivant qui n ont pas encore de  pour l instant je les adapterais manuelement 


apps\web\src\modules\invitation\supabase.ts
```typescript


```



```typescript
apps\web\src\modules\invitation\invitation.ts
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
```
apps\web\src\modules\auth\profile\user.ts
```typescript
Ce fichier est le plus important des trois, parce qu'il casse sans erreur et qu'il cachait une faille.

## Ce qui casse

`ensureRoleProfile` lit `role` et `organization.id` dans `user.user_metadata`. Après le partage, ces deux clés vivent dans `app_metadata`, donc il y trouve `undefined`, sort sans rien faire (`if (!role || !orgId …) return`) et ne crée plus le profil. Le résultat est la boucle de redirection que ton commentaire décrit : `!profileId` renvoie vers `/auth/user-info`, sans fin.

## La faille qu'il contenait déjà

La fonction crée une ligne Prisma (`Direction`, `Teacher`…) dans l'organisation indiquée par `user_metadata`, que le client peut modifier. Un utilisateur connecté qui se met `role: "DIRECTION"` et `organization: { id: "<org d'un autre>" }` dans ses propres metadata, puis appelle `upsertUserProfile`, obtient un profil de direction dans cette organisation. Lire `app_metadata` corrige les deux problèmes d'un coup : les valeurs viennent d'un magasin que seul ton serveur écrit.

## Modifications

**Imports :**

```typescript
import type { AppMetadata } from "@/types/user"          // remplace UserMetadata
import { getRoleProfileKey } from "@/modules/user"
import { syncUserOrganizationProfile } from "@/modules/user/access"   // plus depuis le barrel
```

**`ensureRoleProfile`, où seuls le paramètre et son commentaire changent :**

```typescript
/**
 * Crée (si absent) le profil de rôle pour l'org courante et réinjecte son id
 * dans les metadata d'accès (directionId/teacherId/…). Idempotent. Sans org ou rôle
 * sans profil (ADMIN/GUEST) : no-op. Indispensable pour sortir de la redirection
 * `!profileId → /auth/user-info` (cf. auth/callback).
 *
 * `role` et `organization` viennent de `app_metadata` (écrit par le serveur uniquement) :
 * ne jamais les lire dans `user_metadata`, modifiable par le client.
 */
async function ensureRoleProfile(access: AppMetadata, userId: string) {
  const role = access.role as Role | undefined
  const orgId = access.organization?.id
  if (!role || !orgId || !getRoleProfileKey(role)) return

  const profileId =
    (await findRoleProfileId(role, userId, orgId)) ??
    (await createRoleSpecificEntity(prisma, userId, role, orgId))?.id

  await syncUserOrganizationProfile({ orgId, role, profileId, status: "ACTIVE" })
}
```

**Dans `upsertUserProfile`, l'appel :**

```typescript
await ensureRoleProfile((user.app_metadata ?? {}) as AppMetadata, userId)
```

Le reste du fichier ne change pas. Le `supabase.auth.updateUser({ data: { name, phone } })` écrit des clés de profil dans `user_metadata`, ce qui est exactement leur place. `user` vient de `getUser()`, qui interroge le serveur d'authentification : son `app_metadata` est à jour, pas celui d'un JWT périmé.

## Une dépendance à vérifier

Un `signUpPrincipal` avait `role: DIRECTION` et `function: PRINCIPAL` à l'inscription, et seule l'organisation arrivait plus tard. Maintenant, ces deux valeurs ne sont posées que par ton action de création d'organisation, via `setUserAccess({ role, function, organization, organizations })`. Si ta page de profil (`upsertUserProfile`) passe avant cette création, `ensureRoleProfile` est un no-op, comme avant, faute d'organisation. Mais si la création d'organisation ne pose pas encore `role` ni `function` dans `app_metadata`, le principal restera `GUEST` après sa création d'organisation. C'est le fichier à me montrer ensuite.

## Hors périmètre, mais du même type

`checkUserProfile(userId?)` accepte un identifiant venu du client dans un fichier `"use server"` et répond si ce compte a complété son profil. Les UUID ne se devinent pas, donc le risque est faible, mais si seul ton callback l'appelle avec un id, retire le paramètre ou sors-la du fichier `"use server"`.

```
apps\web\src\modules\auth\supabase.ts
```typescript


```