# Flow auth DIRECTION — PRINCIPAL

> La direction est le **fondateur** de l'organisation.
> Elle s'inscrit en premier, cree l'etablissement, puis complete son profil.
> Elle n'est **pas invitee** — elle cree son propre compte.

---

## Vue d'ensemble

```
/auth/signup/principal
      |
      | signupPrincipalAction()
      | signUpPrincipal()        --> Supabase Auth  (role=DIRECTION, function=PRINCIPAL, status=NEW)
      | createUserRecord()       --> Prisma User    (minimal : id + email + status=PENDING)
      |
/auth/check-email                   (attend clic lien email)
      |
/auth/callback?code=...
      | exchangeCodeForSession()
      | getUserInfo({ cache: false })
      |
      |-- needsOrgSetup ? (function=PRINCIPAL && !organization.id)
      |       |
      |      OUI --> /auth/org/setup
      |               | createOrgAction()
      |               | router.push(REDIRECT_URL)
      |               |
      |          /auth/redirect
      |               | checkUserProfile()  --> false (pas de dateOfBirth)
      |               |
      |          /auth/profile   (ProfileStepper)
      |               | upsertUserProfile()
      |               | ensureRoleProfile() --> cree Direction + injecte directionId dans metadata
      |               |
      |          /{orgSlug}/direction   (dashboard)
      |
      NON --> redirectUser(user) --> /{orgSlug}/direction
```

---

## Etapes detaillees

### Etape 1 — Page d'inscription

**Route :** `/auth/signup/principal`
**Fichier :** [apps/web/src/app/auth/signup/principal/page.tsx](../../../apps/web/src/app/auth/signup/principal/page.tsx)

- Guard : si l'user est deja connecte (`getUserInfo()`), redirige via `redirectUser(user)`
- Sinon : affiche `<SignupPrincipalForm />`

---

### Etape 2 — Action serveur de signup

**Fonction :** [signupPrincipalAction()](../../../apps/web/src/modules/auth/actions/signup.ts#L12)
**Fichier :** [apps/web/src/modules/auth/actions/signup.ts](../../../apps/web/src/modules/auth/actions/signup.ts)

1. **Validation** via `signupSchema` (valibot) — `email` + `password`
2. **Supabase Auth** via [signUpPrincipal()](../../../apps/web/src/modules/auth/supabase.ts#L51)
   - Metadata JWT : `role: DIRECTION`, `function: PRINCIPAL`, `status: NEW`
   - `emailRedirectTo` = [CALL_BACK](../../../apps/web/src/config/url.ts#L9) = `{SITE_URL}/auth/callback`
3. **Prisma** via [createUserRecord({ id, email })](../../../apps/web/src/modules/auth/database/user.mutations.ts#L9)
   - Upsert idempotent — ligne minimale (`status: PENDING`, sans `dateOfBirth`)
   - Le profil sera complete apres creation de l'org (etape 7)
4. **Redirect** vers `/auth/check-email?email=...`

---

### Etape 3 — Verification email

**Route :** `/auth/check-email`
**Fichier :** [apps/web/src/app/auth/check-email/page.tsx](../../../apps/web/src/app/auth/check-email/page.tsx)

- Page statique : invite l'user a cliquer le lien dans son email
- Renvoi possible via [resendSignupEmailAction()](../../../apps/web/src/modules/auth/actions/signup.ts#L47)
  qui appelle [resendSignupEmail()](../../../apps/web/src/modules/auth/supabase.ts#L86)

---

### Etape 4 — Callback Supabase

**Route :** `/auth/callback?code=...`
**Fichier :** [apps/web/src/app/auth/callback/route.ts](../../../apps/web/src/app/auth/callback/route.ts)

1. Recupere `code` et `inviteToken` depuis `searchParams`
2. `supabase.auth.exchangeCodeForSession(code)` — cree la session
3. Si `inviteToken` present → `/auth/invite?token=...` *(flow invite)*
4. [getUserInfo({ cache: false })](../../../apps/web/src/modules/user/userInfo.ts#L194) — **sans cache**
5. `needsOrgSetup = user.function === 'PRINCIPAL' && !user.organization?.id`
   - **Vrai** → `/auth/org/setup`
   - **Faux** → [redirectUser(user)](../../../apps/web/src/config/redirects.ts#L23) → `/{orgSlug}/direction`

---

### Etape 5 — Setup de l'organisation

**Route :** `/auth/org/setup`
**Fichier :** [apps/web/src/app/auth/org/setup/page.tsx](../../../apps/web/src/app/auth/org/setup/page.tsx)

- Guard : si l'user a deja une org → `redirectUser(user)` immediat
- Affiche [OrgSetupForm](../../../apps/web/src/components/auth/org/OrgSetupForm.tsx)
  - Champs : `name`, `slug` (auto-genere), `email` (optionnel)
  - Action : [createOrgAction()](../../../apps/web/src/services/organization/actions/organization.mutations.ts#L23)
  - Succes : `router.push(REDIRECT_URL)` → `/auth/redirect`

> A ce stade : org creee, profil user toujours incomplet (pas de dateOfBirth).
> Le passage par REDIRECT_URL permet de detecter cet etat.

---

### Etape 6 — Hub de routage

**Route :** `/auth/redirect`
**Fichier :** [apps/web/src/app/auth/redirect/page.ts](../../../apps/web/src/app/auth/redirect/page.ts)

1. `getUserInfo()` — recupère l'user courant
2. [checkUserProfile(user.id)](../../../apps/web/src/modules/auth/profile/user.ts#L109)
   — verifie `prisma.user.dateOfBirth`
   - **false** → [PROFILE_URL](../../../apps/web/src/config/url.ts#L19) = `/auth/profile`
   - **true** → [redirectUser(user)](../../../apps/web/src/config/redirects.ts#L23) → `/{orgSlug}/direction`

---

### Etape 7 — Completion du profil

**Route :** `/auth/profile`
**Fichier :** [apps/web/src/app/auth/profile/page.tsx](../../../apps/web/src/app/auth/profile/page.tsx)

- Affiche [ProfileStepper](../../../apps/web/src/components/auth/signup/flow/profile/ProfileStepper.tsx)
- Champs : `firstName`, `lastName`, `sex`, `dateOfBirth`, `phone` (optionnel)
- Action : [upsertUserProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L48)
  1. Met a jour les metadata Supabase Auth (`name`, `phone`)
  2. Upsert `prisma.user` avec les donnees completes
  3. [ensureRoleProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L36)
     — cree l'entite `Direction` en DB si absente
     — injecte `directionId` dans les metadata Supabase (evite la boucle callback)
- Redirect → `/{orgSlug}/direction`

---

### Etape 8 — Dashboard

**Route :** `/{orgSlug}/direction`

User pleinement onboarde :
- Compte Supabase Auth avec metadata complets (role, function, directionId)
- `prisma.user` avec profil complet (dateOfBirth renseigne)
- Organisation creee et associee
- Entite `Direction` creee et liee a l'org

---

## Recapitulatif des fonctions cles

| Fonction | Role | Lien |
|---|---|---|
| `signupPrincipalAction()` | Orchestrateur signup | [signup.ts:12](../../../apps/web/src/modules/auth/actions/signup.ts#L12) |
| `signUpPrincipal()` | Creation compte Supabase Auth | [supabase.ts:51](../../../apps/web/src/modules/auth/supabase.ts#L51) |
| `createUserRecord()` | Creation row Prisma minimale | [user.mutations.ts:9](../../../apps/web/src/modules/auth/database/user.mutations.ts#L9) |
| `resendSignupEmail()` | Renvoi email confirmation | [supabase.ts:86](../../../apps/web/src/modules/auth/supabase.ts#L86) |
| `GET /auth/callback` | Echange code/session + routing | [callback/route.ts](../../../apps/web/src/app/auth/callback/route.ts) |
| `getUserInfo()` | Lecture profil user | [userInfo.ts:194](../../../apps/web/src/modules/user/userInfo.ts#L194) |
| `redirectUser()` | Calcul destination selon role/org | [redirects.ts:23](../../../apps/web/src/config/redirects.ts#L23) |
| `createOrgAction()` | Creation de l'organisation | [organization.mutations.ts:23](../../../apps/web/src/services/organization/actions/organization.mutations.ts#L23) |
| `checkUserProfile()` | Verifie si dateOfBirth est renseigne | [profile/user.ts:109](../../../apps/web/src/modules/auth/profile/user.ts#L109) |
| `upsertUserProfile()` | Complete le profil user | [profile/user.ts:48](../../../apps/web/src/modules/auth/profile/user.ts#L48) |
| `ensureRoleProfile()` | Cree entite Direction + injecte profileId | [profile/user.ts:36](../../../apps/web/src/modules/auth/profile/user.ts#L36) |

---

## Points d'attention

**`/auth/redirect` = hub universel** : toujours y passer apres une action qui change l'etat de
l'user (org creee, profil modifie...) sauf si la destination est connue avec certitude.

**Sentinel profil complet** : `checkUserProfile()` se base uniquement sur `prisma.user.dateOfBirth`.
Si null → profil incomplet, peu importe les autres champs.

**`ensureRoleProfile()` est indispensable** : sans elle, les metadata Supabase ne contiennent pas
le `directionId`. Le callback renverrait indefiniment vers `/auth/org/setup` ou `/auth/profile`.

**`/auth/org/info`** : page intermediaire qui affiche les orgs associees et propose la creation.
S'affiche quand `redirectUser()` trouve un user sans org (cas rare pour PRINCIPAL).
Fichier : [apps/web/src/app/auth/org/info/page.tsx](../../../apps/web/src/app/auth/org/info/page.tsx)