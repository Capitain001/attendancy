# Feature: Sous-modules d'invitation par rôle (D1–D5)

## Description

Restaurer les modules `direction/`, `student/`, `parent/` dans `src/services/invite/`
pour corriger les régressions identifiées dans le rapport `docs/raports/invitation-service-v1-v2.md`.
Le service générique `sendInviteAction` écrit `details: { role }` seulement — les champs
`function`, `additionalFunctions`, `parentLink` lus par `completeSignup` sont toujours
`undefined`, cassant l'assignation des fonctions DIRECTION et la création des `ParentRelation`.

## User Story

En tant que membre DIRECTION  
Je veux inviter un étudiant (avec classe/groupes), un parent (avec lien étudiant) ou un
collègue de direction (avec fonctions)  
Afin que leurs profils soient créés correctement à l'acceptation de l'invitation

## Services concernés

| Service | Impact |
|---|---|
| `invite/` | Cœur — toutes les phases |
| `invite/direction/` | Nouveau sous-module |
| `invite/student/` | Nouveau sous-module |
| `invite/parent/` | Nouveau sous-module |
| `auth/members/complete-signup.ts` | Consommateur — lit `details` → aucun changement |

---

## Analyse des refactors nécessaires (hors scope direct)

### Dans scope (bloquants pour D1)

| Refactor | Fichier | Raison |
|---|---|---|
| Étendre `CreateInvitationParams` | `database/invite.mutations.ts` | Accepter `details` enrichis, `resourceId`, `resourceType` |
| Étendre `InviteDetails` type | `types.ts` | Union avec champs rôle-spécifiques |
| Extraire `_coreInvite` helper | `invite/core.ts` (nouveau) | Token + DB + Supabase partagés entre 4 modules |

### Hors scope — documentés pour la suite

| Item | Fichier | Note |
|---|---|---|
| `createRoleProfile` ne gère pas DIRECTION | `database/invite.mutations.ts` | `inviteDirectionAction` crée un profil via `completeSignup` (auth/members). Si `acceptInviteAction` générique est utilisé pour DIRECTION, il faudra étendre `createRoleProfile`. Hors scope : DIRECTION utilise `completeSignup`, pas `acceptInviteAction`. |
| Cache `checkFunctionsExist` | `invite/direction/database.ts` | V1 utilisait `unstable_cache` + `CACHE.FUNCTIONS`. V2 utilise `"use cache"` + `cacheTag`. À brancher sur le cache V2 lors de l'intégration du cache service `invite/cache.ts`. |
| `sendPushNotificationToUserById` stub | `notification/user.ts` | Implémentation réelle absente — notifications enregistrées mais non envoyées jusqu'à l'implémentation du service push. |
| `INVITABLE_ROLES` exclut DIRECTION | `invite/validation.ts` | Invariant CLAUDE.md : jamais DIRECTION via le flow générique. `inviteDirectionAction` bypasse ce schéma. À documenter dans `invite/CLAUDE.md`. |
| `getClassInvitationsAction` → auth check | `invite/student/actions.ts` | V1 appelait `getAuthorization(user, "DIRECTION", "PRINCIPAL")`. V2 `getAuthorization` a la même signature. Vérifier que `FunctionName` inclut "PRINCIPAL" dans les types V2. |

---

## Fichiers à créer / modifier

### Modifier
| Fichier | Couche | Changement |
|---|---|---|
| `invite/database/invite.mutations.ts` | database | Étendre `CreateInvitationParams` : `details?`, `resourceId?`, `resourceType?` |
| `invite/actions/invite.mutations.ts` | actions | D2: guard `deleteInvitationUserAction` · D4: `invited_by` dans `sendInviteAction` |
| `invite/validation.ts` | validation | D5: `expiresInDays` optionnel dans `sendInviteSchema` |
| `invite/types.ts` | types | Étendre `InviteDetails` avec champs rôle-spécifiques |
| `invite/CLAUDE.md` | doc | Mettre à jour : nouveaux modules, invariant DIRECTION, notifications stub |

### Créer
| Fichier | Couche | Contenu |
|---|---|---|
| `invite/core.ts` | shared util | `generateInviteToken(expiresInDays?)`, `sendSupabaseInviteEmail(email, redirectTo)` |
| `invite/notifications.ts` | shared util | D3: `notifyInvitationStakeholders` fire-and-forget |
| `invite/direction/types.ts` | types | `InviteDirectionParams` |
| `invite/direction/validation.ts` | validation | `inviteDirectionSchema` Valibot |
| `invite/direction/database.ts` | database | `checkFunctionsExist(names, orgId)` |
| `invite/direction/actions.ts` | actions | `inviteDirectionAction` |
| `invite/direction/index.ts` | barrel | exports |
| `invite/student/types.ts` | types | `InviteStudentParams` |
| `invite/student/validation.ts` | validation | `inviteStudentSchema` Valibot |
| `invite/student/database.ts` | database | `checkInvitationResources`, `getClassInvitations` |
| `invite/student/actions.ts` | actions | `inviteStudentAction`, `getClassInvitesAction` |
| `invite/student/index.ts` | barrel | exports |
| `invite/parent/validation.ts` | validation | `inviteParentSchema` Valibot |
| `invite/parent/actions.ts` | actions | `inviteParentAction` |
| `invite/parent/index.ts` | barrel | exports |

---

## Plan d'implémentation

### Phase 1 — Fondations (database + types)

**1.1** `invite/database/invite.mutations.ts` — étendre `CreateInvitationParams`
```ts
// Ajouter :
details?: Record<string, unknown>   // remplace le { role } hardcodé
resourceId?: string
resourceType?: string
```
`createInvitation` passe `details: { role: params.role, ...params.details }`.

**1.2** `invite/types.ts` — étendre `InviteDetails`
```ts
export type InviteDetails =
  | { role: 'TEACHER' }
  | { role: 'STUDENT'; enrollment?: { classId: string; groupIds?: string[]; parentEmail?: string } }
  | { role: 'PARENT'; parentLink: { studentId: string; relation: string } }
  | { role: 'DIRECTION'; function?: string; additionalFunctions?: string[] }
```

**1.3** `invite/core.ts` — helpers partagés (pas `'use server'`)
```ts
export function generateInviteToken(expiresInDays = 7): { token: string; expiresAt: Date }
export async function sendSupabaseInviteEmail(email: string, token: string): Promise<{ error: string } | null>
```
`sendInviteAction` et les sous-modules appellent ces deux fonctions au lieu de dupliquer.

---

### Phase 2 — D4 + D5 sur le flow générique

**2.1** `invite/validation.ts` — D5
```ts
// Ajouter dans sendInviteSchema :
expiresInDays: optional(picklist([1, 3, 7, 14, 30]))
```

**2.2** `invite/actions/invite.mutations.ts` — D4
Dans `sendInviteAction`, après `getUserInfo()` :
```ts
const invitedBy = { id: user.id, name: user.name ?? '', email: user.email ?? '' }
// Passer invitedBy dans details lors de createInvitation
```
Remplacer les appels `generateInviteToken` + Supabase par `core.ts`.

---

### Phase 3 — D2 : guard deleteInvitationUserAction

Dans `invite/actions/invite.mutations.ts` :
```ts
// Avant deleteInvitation(invitation.id) :
const existing = await prisma.userOrganization.findFirst({
  where: { userId: invitation.userId, orgId, deletedAt: null }
})
if (existing) return { success: false, error: 'Utilisateur actif — supprimer via la gestion des membres' }
```
Nécessite lecture du `userId` de l'invitation → adapter `deleteInvitation` ou faire une query séparée.

---

### Phase 4 — D3 : notifications

**4.1** `invite/notifications.ts`
Port de V1 avec adaptation V2 :
- Importer `sendPushNotificationToUserById` depuis `@/services/notification/user`
- Supprimer `NotificationType` (pas dans V2) → utiliser `type: 'INVITATION'` en string
- Garder `Promise.allSettled` + absorption d'erreurs

---

### Phase 5 — D1 : sous-modules

Ordre : **direction** → **student** (dépend de notifications) → **parent**

**5.1 direction/**
- `types.ts` : `InviteDirectionParams { email, name?, functions: string[], expiresInDays? }`
- `validation.ts` : Valibot schema
- `database.ts` : `checkFunctionsExist(names, orgId)` — Prisma direct, sans cache (TODO cache V2)
- `actions.ts` : `inviteDirectionAction`
  - Auth : `getAuthorization(user, 'DIRECTION')`
  - Valide fonctions via `checkFunctionsExist`
  - Stocke `details: { role: 'DIRECTION', function: valid[0], additionalFunctions: valid.slice(1), invited_by }`
  - Appelle `core.sendSupabaseInviteEmail`

**5.2 student/**
- `types.ts` : `InviteStudentParams { email, firstName?, lastName?, classId, groupIds?, parentEmail?, expiresInDays? }`
- `validation.ts` : Valibot schema
- `database.ts` : `checkInvitationResources`, `getClassInvitations`
- `actions.ts` : `inviteStudentAction`, `getClassInvitesAction`
  - Stocke `details: { role: 'STUDENT', enrollment: { classId, groupIds?, parentEmail? }, invited_by }`
  - `resourceId: classId`, `resourceType: 'CLASS'`
  - Notifie via `notifyInvitationStakeholders` (fire-and-forget)

**5.3 parent/**
- `validation.ts` : Valibot schema `{ email, firstName?, lastName?, studentId, relation, expiresInDays? }`
- `actions.ts` : `inviteParentAction`
  - Vérifie `student` appartient à l'org (RULE-USR-001)
  - Stocke `details: { role: 'PARENT', parentLink: { studentId, relation }, invited_by }`
  - `resourceId: studentId`, `resourceType: 'STUDENT'`

---

### Phase 6 — CLAUDE.md + checkers

Mettre à jour `invite/CLAUDE.md` :
- Nouveaux modules dans la table Fichiers
- Invariant DIRECTION (bypass `INVITABLE_ROLES`)
- Note stub notifications

```bash
npx tsx scripts/generate/naming/check.ts invite
npx tsx scripts/generate/types/check.ts invite
npx tsx scripts/generate/api/api.ts invite
```

---

## Validation

```bash
npx tsx scripts/generate/naming/check.ts invite
npx tsx scripts/generate/types/check.ts invite
npx tsx scripts/generate/api/api.ts invite
npx vitest run src/services/invite
```

---

## Critères d'acceptation

- [ ] `inviteDirectionAction({ email, functions: ['PRINCIPAL'] })` → `details.function = 'PRINCIPAL'` en DB
- [ ] `inviteDirectionAction({ email, functions: ['PRINCIPAL', 'SECRETARY'] })` → `details.additionalFunctions = ['SECRETARY']` en DB
- [ ] `inviteStudentAction({ email, classId })` → `details.enrollment.classId` en DB + `resourceId = classId`
- [ ] `inviteParentAction({ email, studentId, relation: 'Père' })` → `details.parentLink = { studentId, relation }` en DB
- [ ] `completeSignup` pour PARENT lit `details.parentLink` → crée `ParentRelation`
- [ ] `completeSignup` pour DIRECTION lit `details.function` + `details.additionalFunctions` → assigne fonctions
- [ ] `deleteInvitationUserAction` sur invitation acceptée → erreur (pas de suppression silencieuse)
- [ ] `sendInviteAction({ email, role: 'TEACHER', expiresInDays: 14 })` → `expiresAt = now + 14j`
- [ ] `details.invited_by.id` présent sur toute invitation créée via `sendInviteAction`
- [ ] Aucun changement sur `acceptInviteAction` / `completeInvite` — rétrocompatibles

---

## Régressions à surveiller

| Risque | Mitigation |
|---|---|
| `sendInviteAction` perd `invited_by` si `getUserInfo()` retourne email null | Guard + fallback `''` |
| `inviteDirectionAction` bypasse `INVITABLE_ROLES` — erreur TypeScript si Role strict | Passer `'DIRECTION' as Role` explicitement |
| `checkFunctionsExist` sans cache → N+1 possible si appelé en boucle | Documenté — cache V2 à brancher ultérieurement |
| `notifyInvitationStakeholders` lancé fire-and-forget — erreur silencieuse si stub | `Promise.allSettled` absorbe, log `console.error` reste |
