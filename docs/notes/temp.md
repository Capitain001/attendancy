$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$invite = @'
# Flow INVITE — Utilisateur invite

> Ce flow concerne tout utilisateur ajoute a l'org par la direction ou un enseignant :
> TEACHER, STUDENT, PARENT, GUEST (et DIRECTION secondaire).
> L'invite ne passe jamais par `/auth/signup/principal`.
> Son compte Supabase Auth est cree par le systeme, pas par lui-meme.

---

## Vue d'ensemble

```
[Panel direction/teacher]
      |
      | inviteUser(params)          <-- orchestrateur central, ne jamais contourner
      | 1. RBAC : getAuthorization(user, ["DIRECTION","TEACHER"])
      | 2. generateInvitationToken()          --> token 64 hex chars, expire 7j par defaut
      | 3. check email dans prisma.user       --> userStatus = "ACTIVE" | "NEW"
      | 4. generateInvitationMetadata()       --> payload JWT (role, org, invited_by, token...)
      |
      | Mode "email"  --> sendSupabaseInvitation()
      |                   supabase.auth.admin.inviteUserByEmail(email, { redirectTo: INVITE_URL })
      |
      | Mode "link"   --> createInvitationLink()
      |                   supabase.auth.admin.generateLink({ type:"invite" })
      |                   --> retourne action_link (pas d'email Supabase)
      |
      | 5. saveInvitationWithAudit()  ATOMIQUE (prisma.$transaction)
      |    --> prisma.Invitation.create()
      |    --> prisma.AuditLog.create()
      |
      | retour : { data: { success, message, metadata, link? } }
      |
      |
[Email invite / Lien copie]
      |
      | clic lien  --> INVITE_URL = {SITE_URL}/auth/invite
      |
/auth/invite                        (client component, lit le hash URL)
      | supabase.auth.setSession({ access_token, refresh_token })
      | --> session etablie
      | router.replace('/auth/welcome')
      |
/auth/welcome
      | getUserInfo()
      | --> affiche NewUserPage (accueil personnalise)
      | --> l'user complete son profil via ProfileStepper
      |
/auth/redirect   (apres completion profil)
      | checkUserProfile()  --> true (dateOfBirth renseigne)
      | redirectUser(user)  --> /{orgSlug}/{role}
      |
/{orgSlug}/{role}               (dashboard selon role)
```

---

## Partie 1 — Emission de l'invitation (cote emetteur)

### Entree principale

**Fonction :** [inviteUser(params)](../../../apps/web/src/modules/invitation/user.ts#L19)
**Fichier :** [apps/web/src/modules/invitation/user.ts](../../../apps/web/src/modules/invitation/user.ts)

> C'est l'**unique point d'entree** du module invitation.
> Ne jamais appeler les sous-services directement depuis un caller externe.

**Params (`InvitationParams`) :**
- `email` — destinataire
- `role` — TEACHER / STUDENT / PARENT / GUEST / DIRECTION
- `adminFunction?` — fonction specifique (ex: SECRETARY)
- `expiresInDays?` — 1 | 3 | 7 | 14 | 30 (defaut: 7)
- `deliveryMethod?` — "email" (defaut) | "link"
- `resourceId?` / `resourceType?` — ressource cible (ex: CLASS, DEPARTMENT)

---

### Etape 1 — Authentification de l'emetteur

[getUserInfo()](../../../apps/web/src/modules/user/userInfo.ts) verifie que l'emetteur est connecte.

---

### Etape 2 — RBAC

[getAuthorization(user, ["DIRECTION","TEACHER"])](../../../apps/web/src/modules/auth/persmission.ts)
verifie que l'emetteur a le droit d'emettre des invitations.

---

### Etape 3 — Token

[generateInvitationToken(expiresInDays?)](../../../apps/web/src/modules/invitation/token.ts#L27)
- `randomBytes(32).toString("hex")` — 64 chars cryptographiquement securises
- Duree whitelist : `[1, 3, 7, 14, 30]` — toute autre valeur → fallback 7 jours

---

### Etape 4 — Statut de l'invite

Lookup `prisma.user` par email.
- Email inconnu → `userStatus = "NEW"`
- Email existant → `userStatus = "ACTIVE"`

Ce statut est injecte dans les metadata Supabase pour que le callback puisse distinguer
un nouvel utilisateur d'un utilisateur deja connu.

---

### Etape 5 — Metadata

[generateInvitationMetadata(params, user, token, userStatus)](../../../apps/web/src/modules/invitation/metadata.ts#L33)

Construit le payload JWT injecte dans `user_metadata` Supabase :

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

### Etape 6 — Envoi Supabase

**Mode "email" (defaut) :**
[sendSupabaseInvitation(email, metadata)](../../../apps/web/src/modules/invitation/invitation.ts#L24)
- `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: INVITE_URL, data: metadata })`
- Supabase cree le compte Auth et envoie l'email automatiquement

**Mode "link" :**
[createInvitationLink(email, metadata)](../../../apps/web/src/modules/invitation/supabase.ts#L205)
- `supabase.auth.admin.generateLink({ type:"invite", ... })`
- Cree le compte Auth en etat "invited" (non confirme)
- Retourne `action_link` — l'emetteur le transmet manuellement (UI, SMS, email custom)
- **Aucun email Supabase n'est envoye**

> **Cas utilisateur deja confirme** : ni `inviteUserByEmail` ni `generateLink(type:"invite")`
> ne fonctionnent. Utiliser [generateMagicLink()](../../../apps/web/src/modules/invitation/supabase.ts#L123) a la place.

---

### Etape 7 — Persistance atomique

[saveInvitationWithAudit()](../../../apps/web/src/modules/invitation/database.ts#L84)
— `prisma.$transaction` avec timeout 20s :
1. `prisma.Invitation.create()` — token, expiry, orgId, role, details
2. `prisma.AuditLog.create()` — userId emetteur, action CREATE, resource "USER"

> Ne jamais appeler `saveInvitationToDatabase` + `logAuditAction` separement —
> l'atomicite est obligatoire.

---

## Partie 2 — Acceptation de l'invitation (cote invite)

### Etape 8 — Clic sur le lien

L'invite recoit un lien pointant vers :
[INVITE_URL](../../../apps/web/src/config/url.ts#L14) = `{SITE_URL}/auth/invite`

Le lien Supabase transporte les tokens dans le **hash URL** (`#access_token=...&refresh_token=...&type=invite`).

---

### Etape 9 — Relay client

**Route :** `/auth/invite`
**Fichier :** [apps/web/src/app/auth/invite/page.tsx](../../../apps/web/src/app/auth/invite/page.tsx)

> Page **client** — obligatoire car le hash URL (`#`) n'est pas accessible cote serveur.

Sequence :
1. Lit `access_token` + `refresh_token` depuis `window.location.hash`
2. `supabase.auth.setSession({ access_token, refresh_token })` — etablit la session
3. Si echec → `/auth/error?error=...`
4. Si succes → `router.replace('/auth/welcome')`

> **Point d'attention :** le callback `/auth/callback` gere le flow PKCE (code dans query params).
> Le flow invitation utilise le hash implicite — c'est pourquoi il a sa propre page `/auth/invite`
> et ne passe PAS par `/auth/callback`.

---

### Etape 10 — Page de bienvenue

**Route :** `/auth/welcome`
**Fichier :** [apps/web/src/app/auth/welcome/page.tsx](../../../apps/web/src/app/auth/welcome/page.tsx)

- `getUserInfo()` — verifie la session
- Affiche [NewUserPage](../../../apps/web/src/components/auth/signup/flow/invited/NewUserPage.tsx)
- L'user complete son profil via `ProfileStepper` (memes etapes que flow DIRECTION etape 7)
- [upsertUserProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L48) + [ensureRoleProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L36)

---

### Etape 11 — Routage final

Apres completion du profil → [REDIRECT_URL](../../../apps/web/src/config/url.ts#L20) → `/auth/redirect`
- [checkUserProfile()](../../../apps/web/src/modules/auth/profile/user.ts#L109) → true
- [redirectUser(user)](../../../apps/web/src/config/redirects.ts#L23) → `/{orgSlug}/{role}`

---

## Resend / Magic link (gestion des invitations existantes)

Fonctions dans [actions.ts](../../../apps/web/src/modules/invitation/actions.ts) :

| Action | Fonction | Quand l'utiliser |
|---|---|---|
| Renvoyer l'invitation | [resendInvitationAction()](../../../apps/web/src/modules/invitation/actions.ts) | User non confirme |
| Generer un lien magique | [generateMagicLinkAction()](../../../apps/web/src/modules/invitation/actions.ts) | User deja confirme |
| Supprimer un invite | [deleteInvitationUserAction()](../../../apps/web/src/modules/invitation/actions.ts) | Annulation |

**Logique resend :** [resendInvitation()](../../../apps/web/src/modules/invitation/supabase.ts#L25)
- User inexistant → `inviteUserByEmail` (nouveau)
- User non confirme → `updateUserById` (merge metadata) + `inviteUserByEmail`
- User confirme → erreur → utiliser `generateMagicLink` a la place

> **Gotcha Supabase :** `inviteUserByEmail` ignore silencieusement le champ `data`
> pour un utilisateur deja cree. Il faut faire un `updateUserById` AVANT pour merger
> les nouvelles metadata — sinon le token est perdu.

---

## Sous-services par role

| Repertoire | Export principal | Role cible |
|---|---|---|
| [student/](../../../apps/web/src/modules/invitation/student/) | `inviteStudent()` | STUDENT |
| [teacher/](../../../apps/web/src/modules/invitation/teacher/) | `inviteTeacher()` | TEACHER |
| [direction/](../../../apps/web/src/modules/invitation/direction/) | `inviteDirection()` | DIRECTION (secondaire) |

Chaque sous-service valide ses params (valibot), enrichit les metadata specifiques
au role, puis delegue a `inviteUser()`.

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
| `InviteRelay` (component) | Etablit la session depuis hash | [invite/page.tsx](../../../apps/web/src/app/auth/invite/page.tsx) |
| `upsertUserProfile()` | Complete le profil | [profile/user.ts:48](../../../apps/web/src/modules/auth/profile/user.ts#L48) |
| `ensureRoleProfile()` | Cree entite role + injecte profileId | [profile/user.ts:36](../../../apps/web/src/modules/auth/profile/user.ts#L36) |

---

## Points d'attention

**Hash vs PKCE :** le flow invitation utilise les tokens dans le hash URL (implicite),
pas un `code` PKCE. C'est pour cela qu'il y a une page `/auth/invite` separee
et non un passage par `/auth/callback`.

**`saveInvitationWithAudit` est atomique :** ne jamais appeler `saveInvitationToDatabase`
et `logAuditAction` separement — les deux doivent reussir ou echouer ensemble.

**Metadata non honorees au resend :** Supabase ignore `data` dans `inviteUserByEmail`
si le compte existe deja. Toujours faire `updateUserById` avant pour persister
le nouveau token dans `user_metadata`.

**Notifications fire-and-forget :**
`void notifyInvitationStakeholders(...)` — ne jamais await dans le flow principal.
Fichier : [notifications.ts](../../../apps/web/src/modules/invitation/notifications.ts)
'@

[System.IO.File]::WriteAllText(
  "c:\PROJECTS\PROJECT\PRODUCTIONS\attendancy\docs\auth\flow\invite.md",
  $invite,
  $utf8NoBom
)

Write-Host "invite.md OK"
