##PLAN DE MIGRATION des donnet de UserInfo de user_metadata vers app_metadata
Voici le plan, dans l'ordre où il est sûr de l'exécuter. J'ai gardé tes noms (`setUserInfo`, `UserMetadata`, `updateUserMetadata`) pour que les appelants ne changent pas. Seules les implémentations bougent.

`UserInfo` conserve `email_verified` et `phone_verified`. Ils sortent de `UserMetadata` et sont dérivés de `email_confirmed_at` et `phone_confirmed_at` dans `mapUserInfo`. Je suppose que c'est ce que tu voulais dire par « omit ».

## Phase 0 : inventaire

Cherche dans tout le monorepo (web, packages, Tauri) :

```
user_metadata | app_metadata | updateUser( | options: { data | inviteUserByEmail | generateLink
```

Chaque occurrence est soit un écrivain (à rediriger vers `app_metadata`), soit un lecteur (à faire lire `app_metadata`). Les écrivains connus sont `setUserInfo`, `cleanUserMetadata`, `updateUserMetadata`, `signUpPersonal`, les envois d'invitation et `syncPermissionsMetadataFor`. Côté lecteurs, regarde aussi le middleware, qui lit peut-être les claims du JWT.

## Phase 1 : types

```typescript
// src/types/user.ts : on retire email_verified / phone_verified de la liste
export const USER_METADATA_KEYS = [
  "role", "name", "avatar_url", "phone", "function",
  "organization", "organizations", "invited_by",
  "status", "invitationToken", "invitationType", "isConnected",
] as const satisfies readonly (keyof UserInfo)[];
```

Le reste du fichier ne change pas, et `UserInfo` non plus. Le nom `USER_METADATA_KEYS` devient un peu trompeur (c'est maintenant `app_metadata`), mais le renommer touche tous les imports pour un gain cosmétique. Je ne l'inclus pas.

## Phase 2 : le cœur (4 fonctions)

```typescript
// modules/user/utils.ts
export function mapUserInfo({ user, userMetadata }: { user: SupabaseUser; userMetadata: UserMetadata }): UserInfo {
  return {
    id: user.id,
    email: user.email ?? undefined,
    email_verified: Boolean(user.email_confirmed_at),
    phone_verified: Boolean(user.phone_confirmed_at),
    role: userMetadata.role || UserRoles.GUEST,
    name: userMetadata.name || user.email?.split("@")[0] || "",
    avatar_url: userMetadata.avatar_url,
    function: userMetadata.function || Functions.MEMBER,
    organization: userMetadata.organization ?? undefined,
    organizations: userMetadata.organizations || [],
    invited_by: userMetadata.invited_by ?? undefined,
    status: userMetadata.status || UserStatus.PENDING,
    invitationToken: userMetadata.invitationToken ?? undefined,
    invitationType: userMetadata.invitationType ?? undefined,
    isConnected: userMetadata.isConnected ?? true,
    updated_at: user.updated_at,
  }
}
```

L'appelant de `mapUserInfo` (dans `getUserInfo`) passe désormais `userMetadata: user.app_metadata as UserMetadata`. `app_metadata` contient aussi `provider` et `providers`, ignorés ici. J'ai corrigé au passage `isConnected || true`, qui valait toujours `true`.

```typescript
// modules/user/update.ts
export async function setUserInfo(userMetadata: UserMetadataPatch) {
  const current = await getUserInfo();
  if (!current?.id) throw new Error("Utilisateur non trouvé");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.admin.updateUserById(current.id, {
    app_metadata: userMetadata,
  });
  if (error) throw error;

  await refreshCurrentUserCache();
  return data.user;
}
```

L'identité vient de `getUserInfo()`. Elle fonctionnera donc aussi avec le Bearer token de Tauri une fois le support ajouté, alors que `supabase.auth.getUser()` ne lit que les cookies. `cleanUserMetadata` change d'une ligne : `user_metadata: { ...wipe, ...user_metadata }` devient `app_metadata: { ...wipe, ...user_metadata }`. Sa liste de clés ne touche pas à `provider` ni `providers`. Même chose pour `updateUserMetadata` : `user_metadata: metadata` devient `app_metadata: metadata`.

## Phase 3 : création de compte et invitations

Les options `data` de `signUp`, `inviteUserByEmail` et `generateLink` écrivent dans `user_metadata`. Elles sont à retirer, et l'écriture passe par `updateUserMetadata` après l'appel.

```typescript
export async function signUpPersonal(email, password, info?) {
  const supabase = await createClient();
  const result = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: CALL_BACK },
  });

  const created = result.data.user;
  if (created?.identities?.length) {
    await updateUserMetadata(created.id, { ...info, status: UserStatus.NEW });
  }
  return result;
}
```

Le garde `identities?.length` évite d'écrire sur un compte déjà existant : Supabase renvoie un utilisateur sans identités quand l'email est déjà pris. Sans lui, quelqu'un pourrait réécrire le `status` d'un autre compte en s'inscrivant avec son adresse.

Pour les invitations, `generateInvitationMetadata` ne passe plus par l'option `data` mais par `updateUserMetadata(id, metadata)`, exécuté après `inviteUserByEmail` ou `generateLink`, pour un utilisateur nouveau comme existant. Ça corrige au passage le bug de `generateMagicLink` et `resendInvitation`, où `data` n'était honoré qu'à la création.

Pense aux templates d'email : `{{ .Data.xxx }}` lit `user_metadata`, donc un nom ou une organisation affichés ainsi seront vides. Vérifie-les dans le dashboard.

## Phase 4 : lecteurs et sync des permissions

- **`syncPermissionsMetadataFor`** : écris `app_metadata: { organizations }` (patch d'une seule clé) au lieu de réécrire l'objet `user_metadata` entier. Le merge est superficiel, donc `provider` n'est jamais touché.
- **Lecteurs directs** : tout `session.user.user_metadata` devient `session.user.app_metadata`. Pour un middleware ou le chemin Bearer lisant les claims, c'est `claims.app_metadata`.
- **Après un switch** : `refreshSession()` côté client, car les claims du JWT ne changent qu'au refresh.

## Phase 5 : données existantes (inutile si tu repars d'une base vide)

L'ordre compte : copier **avant** de déployer le nouveau lecteur, sinon les comptes existants deviennent tous `GUEST`.

```typescript
// scripts/migrate-metadata.ts : service role, idempotent
import { createClient } from "@supabase/supabase-js";
import { USER_METADATA_KEYS } from "@/types/user";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const purge = process.argv.includes("--purge");

let page = 1;
for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  if (!data.users.length) break;

  for (const user of data.users) {
    const from = user.user_metadata ?? {};
    const keys = USER_METADATA_KEYS.filter((k) => k in from);
    if (!keys.length) continue;

    const patch = purge
      ? Object.fromEntries(keys.map((k) => [k, null]))
      : Object.fromEntries(keys.filter((k) => !(k in (user.app_metadata ?? {}))).map((k) => [k, from[k]]));

    if (!Object.keys(patch).length) continue;
    const { error: e } = await admin.auth.admin.updateUserById(user.id, purge ? { user_metadata: patch } : { app_metadata: patch });
    if (e) console.error(user.id, e.message);
  }
  page++;
}
```

1. **Copie** (sans `--purge`) : ne remplit que les clés absentes de `app_metadata`, donc sans écraser les écritures déjà faites par le nouveau code.
2. **Déploiement** du nouveau code (phases 1 à 4).
3. **Deuxième copie**, pour rattraper les écritures faites par l'ancien code entre la copie et le déploiement.
4. **Purge** (`--purge`), une fois tout vérifié : met à `null` ces clés dans `user_metadata`.

Les valeurs copiées viennent de `user_metadata`, que les utilisateurs ont pu modifier. Si tu as un doute sur certains comptes, recalcule `role` et `organizations` depuis Prisma plutôt que de les recopier.

## Phase 6 : vérifications

1. Avec le client navigateur, `supabase.auth.updateUser({ data: { role: "DIRECTION" } })` ne change rien à `getUserInfo()`.
2. Un `setUserInfo({ invitationToken: null })` supprime bien la clé dans `app_metadata`. Je n'ai pas vérifié que `null` supprime une clé de `app_metadata` comme pour `user_metadata`, donc teste-le avant de t'y fier.
3. Inscription, invitation par email, invitation par lien, acceptation, switch de profil, changement d'avatar : chaque flux de bout en bout.
4. Après un switch, le JWT rafraîchi porte le nouveau rôle.

## Phase 7 : garde-fou

Pour qu'une écriture ou une lecture de `user_metadata` ne revienne pas par habitude, une règle ESLint suffit :

```javascript
"no-restricted-syntax": ["error", {
  selector: "MemberExpression[property.name='user_metadata']",
  message: "Utiliser app_metadata (user_metadata est modifiable par le client).",
}]
```

À ajouter dans la config ESLint du monorepo. Si tu as besoin d'une exception ponctuelle, par exemple le script de migration, désactive la règle sur cette ligne.