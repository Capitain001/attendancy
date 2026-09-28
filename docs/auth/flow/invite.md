# Flow INVITE — Utilisateur invite

> Ce flow concerne tout utilisateur ajoute a l'org par la direction ou un enseignant :
> TEACHER, STUDENT, PARENT, GUEST (et DIRECTION secondaire).
> L'invite ne passe jamais par /auth/signup/principal.
> Son compte Supabase Auth est cree par le systeme, pas par lui-meme.

---

## Vue d'ensemble

```
[Panel direction / teacher]
      |
      | inviteUser(params)           <-- orchestrateur, ne jamais contourner
      | 1. RBAC : getAuthorization(user, ["DIRECTION","TEACHER"])
      | 2. generateInvitationToken() --> token 64 hex chars, expire 7j par defaut
      | 3. check prisma.user(email)  --> userStatus = "NEW" | "ACTIVE"
      | 4. generateInvitationMetadata() --> payload JWT complet
      |
      | Mode "email" --> sendSupabaseInvitation()
      |                  supabase.auth.admin.inviteUserByEmail()
      |                  Supabase envoie l'email automatiquement
      |
      | Mode "link"  --> createInvitationLink()
      |                  supabase.auth.admin.generateLink({ type:"invite" })
      |                  retourne action_link sans email Supabase
      |
      | 5. saveInvitationWithAudit()  ATOMIQUE (prisma.$transaction)
      |    --> prisma.Invitation.create()
      |    --> prisma.AuditLog.create()
      |
[Email invite / Lien copie]
      |
      | clic lien --> INVITE_URL = {SITE_URL}/auth/invite
      |              (tokens dans le hash URL : #access_token=...&refresh_token=...)
      |
/auth/invite                        (client component -- lit le hash)
      | supabase.auth.setSession({ access_token, refresh_token })
      | session etablie
      | router.replace('/auth/welcome')
      |
/auth/welcome
      | getUserInfo()
      | affiche NewUserPage (accueil personnalise)
      | --> ProfileStepper --> upsertUserProfile() + ensureRoleProfile()
      | --> router.push(REDIRECT_URL)
      |
/auth/redirect
      | checkUserProfile() --> true (dateOfBirth renseigne)
      | redirectUser(user) --> /{orgSlug}/{role}
      |
/{orgSlug}/{role}                   (dashboard selon role)
```

---

## Partie 1 - Emission de l'invitation (cote emetteur)

### Entree principale

**Fonction :** [inviteUser(params)](../../../apps/web/src/modules/invitation/user.ts#L19)
**Fichier :** [apps/web/src/modules/invitation/user.ts](../../../apps/web/src/modules/invitation/user.ts)

> C'est l'unique point d'entree du module invitation.
> Ne jamais appeler les sous-services directement depuis un caller externe.

**Params (InvitationParams) :**
- `email` -- destinataire
- `role` -- TEACHER / STUDENT / PARENT / GUEST / DIRECTION
- `adminFunction?` -- fonction specifique (ex: SECRETARY)
- `expiresInDays?` -- 1 | 3 | 7 | 14 | 30 (defaut: 7)
- `deliveryMethod?` -- "email" (defaut) | "link"
- `resourceId?` / `resourceType?` -- ressource cible (ex: CLASS, DEPARTMENT)

---

### Etape 1 - Authentification de l'emetteur

[getUserInfo()](../../../apps/web/src/modules/user/userInfo.ts#L194) -- verifie que l'emetteur
est connecte. Rejette immediatement si aucune session active.

---

### Etape 2 - RBAC

[getAuthorization(user, ["DIRECTION","TEACHER"])](../../../apps/web/src/modules/auth/persmission/autorization.ts#L62)
Seuls DIRECTION et TEACHER peuvent emettre des invitations.

---

### Etape 3 - Token

[generateInvitationToken(expiresInDays?)](../../../apps/web/src/modules/invitation/token.ts#L27)
- `randomBytes(32).toString("hex")` -- 64 chars cryptographiquement securises
- Duree whitelist : [1, 3, 7, 14, 30] -- toute autre valeur tombe sur 7 jours

---

### Etape 4 - Statut de l'invite

Lookup `prisma.user` par email :
- Email inconnu → `userStatus = "NEW"`
- Email existant → `userStatus = "ACTIVE"`

Ce statut est injecte dans les metadata Supabase pour distinguer un nouvel utilisateur
d'un utilisateur deja connu lors du callback.

---

### Etape 5 - Metadata

[generateInvitationMetadata(params, user, token, userStatus)](../../../apps/web/src/modules/invitation/metadata.ts#L33)

Construit le payload injecte dans `user_metadata` Supabase :

| Champ | Valeur |
|---|---|
| `role` | role de l'invite |
| `function` | fonction admin (optionnel) |
| `organization` | { id, name, slug, logo, permissions, departmentId } |
| `organizations` | tableau avec la meme org |
| `invited_by` | { id, name, email } de l'emetteur |
| `status` | "NEW" ou "ACTIVE" |
| `invitationStatus` | "PENDING" |
| `invitationToken` | token genere a l'etape 3 |
| `invitationType` | "INVITE_ONLY" |

---

### Etape 6 - Envoi Supabase

**Mode "email" (defaut) :**
[sendSupabaseInvitation(email, metadata)](../../../apps/web/src/modules/invitation/invitation.ts#L24)
- `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: INVITE_URL, data: metadata })`
- Supabase cree le compte Auth et envoie l'email automatiquement

**Mode "link" :**
[createInvitationLink(email, metadata)](../../../apps/web/src/modules/invitation/supabase.ts#L205)
- `supabase.auth.admin.generateLink({ type:"invite", ... })`
- Cree le compte Auth en etat "invited" (non confirme)
- Retourne `action_link` sans aucun email Supabase
- L'emetteur transmet le lien manuellement (UI, SMS, email custom)

> Cas utilisateur deja confirme : ni inviteUserByEmail ni generateLink(type:"invite")
> ne fonctionnent. Utiliser generateMagicLink() a la place.

---

### Etape 7 - Persistance atomique

[saveInvitationWithAudit()](../../../apps/web/src/modules/invitation/database.ts#L84)
`prisma.$transaction` avec maxWait 10s / timeout 20s :
1. `prisma.Invitation.create()` -- email, token, expiry, orgId, role, details, resourceId?
2. `prisma.AuditLog.create()` -- userId emetteur, action CREATE, resource "USER"

> Ne jamais separer les deux writes -- l'atomicite est obligatoire.

---

## Partie 2 - Acceptation de l'invitation (cote invite)

### Etape 8 - Clic sur le lien

L'invite recoit un lien pointant vers :
[INVITE_URL](../../../apps/web/src/config/url.ts#L14) = `{SITE_URL}/auth/invite`

Le lien Supabase transporte les tokens dans le **hash URL** :
`/auth/invite#access_token=...&refresh_token=...&type=invite`

> Difference cle avec le flow DIRECTION : le flow invitation utilise le hash implicite,
> pas un code PKCE. C'est pourquoi il a sa propre page /auth/invite et ne passe PAS
> par /auth/callback.

---

### Etape 9 - Relay client (etablissement de session)

**Route :** `/auth/invite`
**Fichier :** [apps/web/src/app/auth/invite/page.tsx](../../../apps/web/src/app/auth/invite/page.tsx)

Page client (obligatoire -- le hash # n'est pas lisible cote serveur).

Sequence :
1. Lit `access_token` + `refresh_token` depuis `window.location.hash`
2. `supabase.auth.setSession({ access_token, refresh_token })` -- etablit la session cookie
3. Si echec → `/auth/error?error=...`
4. Si succes → `router.replace('/auth/welcome')`

---

### Etape 10 - Page de bienvenue

**Route :** `/auth/welcome`
**Fichier :** [apps/web/src/app/auth/welcome/page.tsx](../../../apps/web/src/app/auth/welcome/page.tsx)

- `getUserInfo()` -- verifie la session (redirect /login si absente)
- Affiche [NewUserPage](../../../apps/web/src/components/auth/signup/flow/invited/NewUserPage.tsx)
- L'user complete son profil via `ProfileStepper`
- Action : [upsertUserProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L48)
  1. Met a jour les metadata Supabase Auth (name, phone)
  2. Upsert `prisma.user` avec les donnees completes (dateOfBirth obligatoire)
  3. [ensureRoleProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L36) --
     cree l'entite metier (Teacher / Student / Parent...) + injecte le profileId dans metadata
- Apres succes → `router.push(REDIRECT_URL)`

---

### Etape 11 - Routage final

**Route :** `/auth/redirect`
**Fichier :** [apps/web/src/app/auth/redirect/page.ts](../../../apps/web/src/app/auth/redirect/page.ts)

- [checkUserProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L109) → true
- [redirectUser(user)](../../../apps/web/src/config/redirects.ts#L23) → `/{orgSlug}/{role}`

---

## Resend / Magic link (gestion apres envoi)

Fonctions dans [actions.ts](../../../apps/web/src/modules/invitation/actions.ts) :

| Action | Quand l'utiliser |
|---|---|
| [`resendInvitationAction()`](../../../apps/web/src/modules/invitation/actions.ts#L44) | User non confirme -- renvoie l'email |
| [`generateMagicLinkAction()`](../../../apps/web/src/modules/invitation/actions.ts#L98) | User deja confirme -- genere un lien de connexion |
| [`deleteInvitationUserAction()`](../../../apps/web/src/modules/invitation/actions.ts#L151) | Annuler une invitation |
| [`getInvitationStatsAction()`](../../../apps/web/src/modules/invitation/actions.ts#L211) | Stats (total / pending / expired / accepted) |

**Logique resend** via [resendInvitation()](../../../apps/web/src/modules/invitation/supabase.ts#L25) :
- User inexistant → `inviteUserByEmail` (creation)
- User non confirme → `updateUserById` (merge metadata) + `inviteUserByEmail`
- User confirme → erreur → utiliser `generateMagicLink` a la place

> Gotcha Supabase : `inviteUserByEmail` ignore silencieusement le champ `data`
> pour un user deja cree. Il faut appeler `updateUserById` AVANT pour persister
> le nouveau token dans user_metadata -- sinon le token est perdu.

**Magic link** via [generateMagicLink()](../../../apps/web/src/modules/invitation/supabase.ts#L123) :
- Meme gotcha : `generateLink` ignore `data` pour un user existant
- Il faut faire `updateUserById` AVANT pour merger les metadata
- `supabase.auth.admin.generateLink({ type:"magiclink", ... })` → retourne `action_link`

---

## Sous-services par role

Chaque sous-service valide ses params (valibot), enrichit les metadata specifiques,
puis delegue a `inviteUser()`.

| Repertoire | Export principal | Role cible |
|---|---|---|
| [student/](../../../apps/web/src/modules/invitation/student/) | [`inviteStudent()`](../../../apps/web/src/modules/invitation/student/actions.ts#L25) | STUDENT |
| [teacher/](../../../apps/web/src/modules/invitation/teacher/) | [`inviteTeacher()`](../../../apps/web/src/modules/invitation/teacher/invite.ts#L19) | TEACHER |
| [direction/](../../../apps/web/src/modules/invitation/direction/) | [`inviteDirection()`](../../../apps/web/src/modules/invitation/direction/actions.ts#L28) | DIRECTION (secondaire) |

---

## Recap fonctions cles

| Fonction | Role | Lien |
|---|---|---|
| `inviteUser()` | Orchestrateur central | [user.ts:19](../../../apps/web/src/modules/invitation/user.ts#L19) |
| `generateInvitationToken()` | Token crypto + expiry | [token.ts:27](../../../apps/web/src/modules/invitation/token.ts#L27) |
| `generateInvitationMetadata()` | Payload JWT complet | [metadata.ts:33](../../../apps/web/src/modules/invitation/metadata.ts#L33) |
| `sendSupabaseInvitation()` | Envoi email via Supabase | [invitation.ts:24](../../../apps/web/src/modules/invitation/invitation.ts#L24) |
| `createInvitationLink()` | Lien sans email | [supabase.ts:205](../../../apps/web/src/modules/invitation/supabase.ts#L205) |
| `saveInvitationWithAudit()` | Persistance atomique | [database.ts:84](../../../apps/web/src/modules/invitation/database.ts#L84) |
| `resendInvitation()` | Renvoi invite non confirme | [supabase.ts:25](../../../apps/web/src/modules/invitation/supabase.ts#L25) |
| `generateMagicLink()` | Lien pour user confirme | [supabase.ts:123](../../../apps/web/src/modules/invitation/supabase.ts#L123) |
| `InviteRelay` (component) | Etablit session depuis hash | [invite/page.tsx](../../../apps/web/src/app/auth/invite/page.tsx) |
| `upsertUserProfile()` | Complete le profil user | [profile/user.ts:48](../../../apps/web/src/modules/auth/profile/user.ts#L48) |
| `ensureRoleProfile()` | Cree entite role + injecte profileId | [profile/user.ts:36](../../../apps/web/src/modules/auth/profile/user.ts#L36) |

---

## Points d'attention

**Hash vs PKCE :** le flow invitation transporte les tokens dans le hash URL (implicite).
Le flow DIRECTION utilise PKCE (code dans query params → /auth/callback).
Ne pas confondre les deux -- ils ont chacun leur route d'entree.

**saveInvitationWithAudit est atomique :** ne jamais appeler saveInvitationToDatabase
et logAuditAction separement -- les deux doivent reussir ou echouer ensemble.

**Metadata ignorees au resend :** Supabase ignore le champ `data` dans inviteUserByEmail
si le compte existe deja. Toujours faire updateUserById avant pour persister le nouveau
token dans user_metadata.

**ensureRoleProfile est indispensable :** sans elle, les metadata ne contiennent pas
le profileId (teacherId / studentId...), et le callback renverrait l'user en boucle.

**Notifications fire-and-forget :**
`void notifyInvitationStakeholders(...)` -- ne jamais await dans le flow principal.
Fichier : [notifications.ts](../../../apps/web/src/modules/invitation/notifications.ts)