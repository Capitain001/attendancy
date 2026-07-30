# Rapport de comparaison : Service Invitation V1 → V2

**Date :** 2026-07-29  
**Périmètre :** `src/services/invitation/` (V1) ↔ `src/services/invite/` (V2)  
**Scope connexe :** `src/services/auth/members/` (les deux versions)

---

## 1. Structure des répertoires

| Chemin | V1 | V2 |
|--------|----|----|
| Service principal | `services/invitation/` | `services/invite/` |
| Sous-domaines | `direction/`, `student/`, `teacher/`, `parent/` | ∅ (supprimés) |
| Actions | `actions/invitation.queries.ts` + mutations | `actions/invite.mutations.ts` + `invite.queries.ts` |
| Database | `database/queries.ts` + `database/mutations.ts` | `database/invite.queries.ts` + `invite.mutations.ts` |
| Notification | `notifications.ts` | ∅ |
| Metadata | `metadata.ts` | ∅ (inline dans l'action) |
| Token | `token.ts` | ∅ (inline `crypto.randomUUID()`) |
| Status | `status.ts` | `types.ts` (fonctions déplacées) |

---

## 2. Régressions identifiées

### 2.1 Suppression des flux par rôle
**Gravité : haute**

V1 avait un module par rôle invitable (`direction/`, `student/`, `teacher/`, `parent/`), chacun avec :
- validation Valibot spécifique au rôle
- vérification de ressources (classe, étudiant, fonctions)
- stockage structuré dans `invitation.details`

V2 envoie `{ role }` uniquement dans `details`. Toutes les métadonnées spécifiques au rôle ont été perdues.

**Impact concret :**
- `inviteStudent` : perd `classId`, `groupIds`, `parentEmail`
- `inviteDirection` : perd `additionalFunctions`, `function`
- `inviteParent` : perd `studentId`, `relation` → `completeSignup` ne peut pas créer `ParentRelation`
- `inviteTeacher` : perd `resources` (courses, classes)

> ⚠ `completeSignup` V2 lit `details.parentLink`, `details.additionalFunctions`, `details.function` — ces champs ne sont **jamais écrits** par `sendInviteAction`. Le lien parent et les fonctions DIRECTION ne fonctionnent pas.

### 2.2 Token : UUID vs hex 32 bytes
**Gravité : faible**

| | V1 | V2 |
|---|---|---|
| Génération | `randomBytes(32).toString('hex')` (64 chars) | `crypto.randomUUID()` (36 chars) |
| Durée configurable | Oui — 1/3/7/14/30 jours | Non — valeur fixe non documentée |

Le token UUID est valide mais `token.ts` disparaît → plus de validation de durée ni de liste blanche.

### 2.3 `deleteInvitationUserAction` : comportement altéré
**Gravité : moyenne**

- V1 : vérifie si l'utilisateur Supabase existe ET n'a pas de record Prisma avant suppression (logique défensive)
- V2 : supprime le record `Invitation` directement, sans vérification Supabase

L'utilisateur Supabase peut rester orphelin après suppression invitation en V2.

### 2.4 Notifications : suppression complète
**Gravité : moyenne**

`notifications.ts` V1 notifiait la direction + l'auteur de l'action lors de `CREATED`, `RESENT`, `LINK_GENERATED`. En V2 ce système n'a pas été remplacé.

### 2.5 Metadata `invited_by` absente
**Gravité : faible**

V1 stockait `invited_by: { id, name, email }` dans `details` via `metadata.ts`. V2 ne le stocke pas. L'audit de `completeSignup` V2 log `details.invited_by` qui sera toujours `undefined`.

### 2.6 `logAudit` → `logAuditAsync` : ordre inversé
**Gravité : faible**

- V1 : audit **après** `syncUserOrganizationProfile`, dans `setImmediate`
- V2 : `syncUserOrganizationProfile` d'abord, puis `logAuditAsync` — même ordre, mais `logAuditAsync` n'est plus dans `setImmediate`, sa non-attente est implicite

Pas de régression fonctionnelle, mais la sémantique "fire-and-forget" est moins explicite.

---

## 3. Améliorations de V2

### 3.1 `tx.user.upsert()` — idempotence
**Impact : haute valeur**

V1 utilisait `tx.user.create()` — une re-tentative après timeout réseau créait une erreur de contrainte unique. V2 upsert est safe à rejouer.

### 3.2 Retour `{ data } | { error }` — convention projet
**Impact : haute valeur**

V1 retournait `{ success: true }` / `{ success: false, error }`, incompatible avec la convention `ActionResponse` du projet. V2 est conforme.

### 3.3 `completeSignup` — helpers extraits (après merge)
Post-merge, les helpers `createUserInOrganization`, `assignUserFunctions`, `logSignupAudit` sont extraits → testabilité améliorée.

### 3.4 `getInviteByTokenAction` — retour typé `{ data } | { error }`
V1 retournait directement la valeur ou lançait. V2 encapsule proprement.

### 3.5 `UserOrganization.status = 'ACTIVE'` explicite
V2 ajoute `status: 'ACTIVE'` lors du upsert `UserOrganization`. V1 ne le posait pas.

### 3.6 `INVITABLE_ROLES` centralisé
`validation.ts` V2 exporte `INVITABLE_ROLES = ['TEACHER', 'STUDENT', 'PARENT']` comme constante TypeScript discriminée → narrowing de type possible.

---

## 4. Divergences neutres (ni régression ni amélioration)

| Point | V1 | V2 |
|---|---|---|
| Nom du service | `invitation` | `invite` |
| `submitSignupForm` params | `{ email?, password, confirmPassword }` | `{ password, confirmPassword }` (email retiré — non utilisé) |
| `resolveInvitationStatus` | dans `status.ts` | dans `types.ts` |
| `calculateInvitationStats` | dans `status.ts` | dans `types.ts` |
| `orgInvitationsQuery` | appelle `getOrgInvitationsAction` | appelle `getOrgInvitesAction` |

---

## 5. Plan de réconciliation recommandé

### Priorité 1 — Blocker fonctionnel
**Restaurer les métadonnées par rôle dans `sendInviteAction`**

`sendInviteAction` doit accepter un payload étendu selon le rôle et le stocker dans `details` de façon à ce que `completeSignup` puisse lire :
- `details.function` et `details.additionalFunctions` (DIRECTION)
- `details.parentLink.studentId` et `details.parentLink.relation` (PARENT)

Option A : réintégrer `direction/`, `student/`, `parent/` comme modules V1.  
Option B : étendre `sendInviteSchema` avec un champ `roleData` discriminé par rôle (Valibot union).

### Priorité 2 — Intégrité Supabase
**Restaurer la vérification dans `deleteInvitationUserAction`**

Avant suppression du record `Invitation`, vérifier que l'utilisateur Supabase n'a pas de record actif dans `UserOrganization`.

### Priorité 3 — Qualité audit
**Restaurer `invited_by` dans `createInvitation`**

Passer `invited_by: { id, name, email }` dans `details` au moment de la création, en utilisant `getUserInfo()` dans `sendInviteAction`.

### Priorité 4 — Token configurable
**Réintroduire `expiresInDays` dans le schéma de validation**

Ajouter un champ optionnel `expiresInDays` dans `sendInviteSchema` avec liste blanche [1, 3, 7, 14, 30].

### Priorité 5 — Notifications
**Décider du système de notification**

Soit réintégrer `notifications.ts`, soit documenter l'abandon explicitement dans `invite/CLAUDE.md`.

---

## 6. Tableau de synthèse

| # | Point | Type | Gravité | Action |
|---|---|---|---|---|
| R1 | Perte métadonnées rôle dans `details` | Régression | Haute | Restaurer payload structuré |
| R2 | `ParentRelation` jamais créé | Régression | Haute | Dépend de R1 |
| R3 | Fonctions DIRECTION non assignées | Régression | Haute | Dépend de R1 |
| R4 | `deleteInvitationUserAction` sans guard Supabase | Régression | Moyenne | Réintroduire vérification |
| R5 | Notifications supprimées | Régression | Moyenne | Décision produit requise |
| R6 | `invited_by` absent du log | Régression | Faible | Passer dans `details` à la création |
| R7 | Token non configurable | Régression | Faible | `expiresInDays` optionnel |
| A1 | `tx.user.upsert()` idempotent | Amélioration | Haute | Conserver |
| A2 | Retour `{ data } \| { error }` | Amélioration | Haute | Conserver |
| A3 | `INVITABLE_ROLES` typé | Amélioration | Moyenne | Conserver |
| A4 | `UserOrganization.status` explicite | Amélioration | Faible | Conserver |
