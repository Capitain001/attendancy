# Routage Post-Auth, Complétion du Profil & Hub d'Espaces (Web)

Ce document décrit les mécanismes transverses de navigation après authentification sur `apps/web` : le callback PKCE, le hub `/auth/redirect`, la complétion du profil civique (`/auth/profile`), la résolution d'URL (`redirectUser`) et le sélecteur d'organisation/profil (`/auth/org/info` et `/auth/org/profile`).

---

## 1. Vue d'ensemble de l'aiguillage post-authentification

```text
Connexion (login) OU Confirmation email (/auth/callback) OU Acceptation invitation
  │
  ▼
/auth/redirect  (Hub de vérification du profil civique)
  ├─ checkUserProfile(user.id) → prisma.user.dateOfBirth renseigné ?
  │    ├─ NON → /auth/profile (ProfileStepper : upsertUserProfile + ensureRoleProfile)
  │    └─ OUI ↓
  ▼
redirectUser(user)  (apps/web/src/config/redirects.ts)
  ├─ Pas d'organisation active (!user.organization?.slug)
  │    └─ /auth/org/info  (Hub "Mes espaces" : Espace personnel + Établissements)
  │         └─ /auth/org/profile?organizationId=... (Choix ou création d'un profil de rôle)
  │
  ├─ Espace personnel (org.type === 'PERSONAL') ET role === 'TEACHER'
  │    └─ /personal/{orgSlug}/teacher
  │
  └─ Organisation INSTITUTION (ou STUDENT/PARENT dans une org PERSONAL)
       └─ /{orgSlug}/{rolePath}   (ex: /havard/direction, /havard/student…)
```

---

## 2. Callback Supabase PKCE (`/auth/callback`)

**Fichier :** [`apps/web/src/app/auth/callback/route.ts`](../../../apps/web/src/app/auth/callback/route.ts)

Utilisé lors de la confirmation d'email d'inscription (`signupPrincipalAction`, `signupPersonalAction`) et des flux OAuth :

1. Lit `code` et `inviteToken` dans les `searchParams`. Sans `code` $\rightarrow$ redirige vers `/login`.
2. Échange le code contre une session cookie via `supabase.auth.exchangeCodeForSession(code)`.
3. Si `inviteToken` est présent $\rightarrow$ redirige vers `/auth/invite?token=${inviteToken}`.
4. Charge l'utilisateur frais via `getUserInfo({ cache: false })`.
5. **Cas Fondateur d'établissement** : si `user.function === 'PRINCIPAL' && !user.organization?.id` $\rightarrow$ redirige vers `/auth/org/setup`.
6. Sinon $\rightarrow$ redirige vers `redirectUser(user)`.

---

## 3. Hub `/auth/redirect` & Complétion du Profil (`/auth/profile`)

### Le Hub `/auth/redirect`

**Fichier :** [`apps/web/src/app/auth/redirect/page.ts`](../../../apps/web/src/app/auth/redirect/page.ts)

Point de passage standard après toute opération qui initialise ou modifie la structure du compte (création d'établissement, création d'espace personnel, etc.) :

1. Appelle `getUserInfo()` puis `checkUserProfile(user.id)`.
2. Si `checkUserProfile` retourne `false` $\rightarrow$ redirige vers `PROFILE_URL` (`/auth/profile`).
3. Si `checkUserProfile` retourne `true` $\rightarrow$ redirige vers `redirectUser(user)`.

### Sentinelle & Action de Profil (`src/modules/auth/profile/user.ts`)

**Fichier :** [`apps/web/src/modules/auth/profile/user.ts`](../../../apps/web/src/modules/auth/profile/user.ts)

- **`checkUserProfile(userId?)`** : vérifie **uniquement** si `prisma.user.dateOfBirth` est non null. C'est la sentinelle universelle indiquant que le profil civique a été complété.
- **`upsertUserProfile({ firstName, lastName, sex, dateOfBirth, phone? })`** (appelée par le `ProfileStepper` sur `/auth/profile` ou `/auth/welcome`) :
  1. Met à jour `user_metadata` dans Supabase Auth (`name: "${firstName} ${lastName}"`, `phone`).
  2. Exécute `prisma.user.upsert` avec `firstName`, `lastName`, `sex`, `dateOfBirth` et `phone`.
  3. Appelle **`ensureRoleProfile(user.app_metadata, userId)`** :
     - Lit `role` et `organization.id` depuis `app_metadata` (jamais `user_metadata`).
     - Cherche ou crée l'entité métier correspondante (`Teacher`, `Student`, `Parent`, `Direction`) via `createRoleSpecificEntity()`.
     - Synchronise le `profileId` (`directionId`, `teacherId`, etc.) et passe `status: "ACTIVE"` dans `app_metadata` via `syncUserOrganizationProfile()`.

---

## 4. Règles de résolution d'URL (`redirectUser`)

**Fichier :** [`apps/web/src/config/redirects.ts`](../../../apps/web/src/config/redirects.ts)

| Condition sur `user` | URL retournée par `redirectUser(user)` |
|---|---|
| `!user.organization?.slug` | `/auth/org/info` |
| `!user.role` | `/login` |
| `org.type === 'PERSONAL'` et `role === 'TEACHER'` | `/personal/{slug}/teacher` |
| Tout autre cas (`INSTITUTION`, ou `STUDENT`/`PARENT` en `PERSONAL`) | `/{slug}/{rolePath}` (`admin`, `direction`, `teacher`, `student`, `parent`) |

> **Pourquoi seul `TEACHER` a une route `/personal/{slug}/teacher` ?**
> L'enseignant indépendant dispose d'une interface dédiée (gestion de classes cohortes/thématiques, cours, séances). En revanche, un `STUDENT` ou un `PARENT` rattaché à une organisation `PERSONAL` utilise les mêmes écrans que dans une institution (emploi du temps, scan QR) et passe donc par `/{slug}/student` ou `/{slug}/parent`.

---

## 5. Hub Multi-Organisations & Sélecteur de Profil (`/auth/org/info` & `/auth/org/profile`)

Lorsqu'un utilisateur n'a pas encore d'organisation active (ex. après une inscription personnelle) ou souhaite changer d'organisation/rôle :

### Étape 1 — `/auth/org/info` ("Mes espaces")

**Fichier :** [`apps/web/src/app/auth/org/info/page.tsx`](../../../apps/web/src/app/auth/org/info/page.tsx)

- Affiche **toujours en première position** la carte **Espace personnel** (`type === 'PERSONAL'`), même si l'organisation personnelle n'a pas encore été créée en base (lien vers `/auth/org/profile?organizationId=personal`).
- Affiche ensuite les cartes de toutes les organisations institutionnelles (`type !== 'PERSONAL'`) présentes dans `user.organizations`, avec les icônes des profils disponibles (`teacherId`, `studentId`, `parentId`, `directionId`).

### Étape 2 — `/auth/org/profile?organizationId=...` ("Choisir un profil")

**Fichiers :**
- [`apps/web/src/app/auth/org/profile/page.tsx`](../../../apps/web/src/app/auth/org/profile/page.tsx)
- [`apps/web/src/app/auth/org/profile/helper.ts`](../../../apps/web/src/app/auth/org/profile/helper.ts)
- [`apps/web/src/services/organization/actions/organization.mutations.ts`](../../../apps/web/src/services/organization/actions/organization.mutations.ts)

Trois situations sont gérées sur cette page :

1. **Espace personnel non initialisé (`organizationId === 'personal'` sans profil)** :
   - Propose les rôles personnels (`TEACHER`, `STUDENT`, `PARENT`) via `<PersonalRoleOptions />`.
   - Soumet `selectPersonalRoleFormAction` $\rightarrow$ `createPersonalOrgAction(role)` $\rightarrow$ redirige vers `/auth/redirect`.
2. **Sélection d'un profil existant (Institution ou Espace personnel)** :
   - Appelle `selectOrganizationProfileAction(organizationId, role)` :
     - Vérifie que l'organisation appartient à `user.organizations` et que l'utilisateur possède bien le `profileId` correspondant au rôle demandé.
     - Met à jour `app_metadata` via `setUserAccess({ role, organization, organizations })`.
     - Redirige vers `redirectUser({ ...user, role, organization })`.
3. **Ajout d'un rôle supplémentaire à un Espace personnel existant** :
   - Affiche `<PersonalRolePicker />` pour les rôles personnels non encore activés (`unassignedPersonalRoles`), qui déclenche `createPersonalOrgAction(role)` $\rightarrow$ `createPersonalProfileAction(existing.id, role)`.

